import { test, expect, type Page } from '@playwright/test';

test.setTimeout(90_000);
const textQueueKey = 'getrentos.agent.offline-queue';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const token = `test.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.test`;
    localStorage.setItem('getrentos_auth_token', token);
    localStorage.setItem(
      'getrentos_user',
      JSON.stringify({
        id: 'agent-queue-test',
        fullName: 'Queue Tester',
        email: 'queue@example.test',
        roles: ['AGENT'],
      })
    );
  });
});

async function seed(page: Page, type: string, binary = false) {
  await page.goto('/login');
  await page.evaluate(
    async ({ type, binary, textQueueKey }) => {
      const payloads: Record<string, object> = {
        inspection: {
          taskId: 'task-1',
          scheduledAt: new Date().toISOString(),
          type: 'PERIODIC',
          rooms: [],
        },
        verification: {
          taskId: 'task-1',
          subjectName: 'Test tenant',
          subjectType: 'TENANT',
          idVerified: false,
          addressConfirmed: true,
        },
        message: { id: 'conversation-1', text: 'Field report ready', files: [] },
        document: { name: 'Field report', category: 'inspection_report' },
      };
      const operation = {
        id: 'queued-1',
        type,
        payload: payloads[type],
        createdAt: new Date().toISOString(),
      };
      if (!binary) {
        localStorage.setItem(textQueueKey, JSON.stringify([operation]));
        return;
      }
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('getrentos-agent-offline', 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore('operations', { keyPath: 'id' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('operations', 'readwrite');
        transaction.objectStore('operations').put({
          ...operation,
          files: [new File(['original field evidence'], 'evidence.txt', { type: 'text/plain' })],
        });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    },
    { type, binary, textQueueKey }
  );
}

async function queuedCount(page: Page, binary: boolean) {
  return page.evaluate(
    async ({ binary, textQueueKey }) => {
      if (!binary) return JSON.parse(localStorage.getItem(textQueueKey) || '[]').length;
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('getrentos-agent-offline', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const count = await new Promise<number>((resolve, reject) => {
        const request = db.transaction('operations').objectStore('operations').count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return count;
    },
    { binary, textQueueKey }
  );
}

for (const { type, binary } of [
  { type: 'inspection', binary: false },
  { type: 'verification', binary: false },
  { type: 'message', binary: false },
  { type: 'document', binary: true },
  { type: 'message', binary: true },
]) {
  test(`${type} (${binary ? 'file' : 'text'}) survives API rejection and reload, then uploads on retry`, async ({
    page,
  }) => {
    let allowSave = false;
    let saved = 0;
    let attempts = 0;
    let lastBody = '';
    await page.route('**/__qa_api/**', async (route) => {
      if (route.request().method() === 'POST') {
        attempts++;
        lastBody = route.request().postDataBuffer()?.toString() || '';
        if (allowSave) saved++;
        await route.fulfill({
          status: allowSave ? 201 : 403,
          json: allowSave ? { id: 'saved-1' } : { message: 'Task access was revoked' },
        });
      } else {
        await route.fulfill({ json: [] });
      }
    });
    await seed(page, type, binary);
    await page.goto('/agent/sync');
    await expect.poll(() => attempts).toBeGreaterThan(0);
    await expect(page.getByText('Waiting to upload', { exact: true })).toBeVisible();
    expect(await queuedCount(page, binary)).toBe(1);

    await page.reload();
    await expect(page.getByText('Waiting to upload', { exact: true })).toBeVisible();
    expect(await queuedCount(page, binary)).toBe(1);
    // A refused manual retry must show an error and retain the durable copy.
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByText('Upload could not be completed')).toBeVisible();
    expect(await queuedCount(page, binary)).toBe(1);

    allowSave = true;
    await page.getByRole('button', { name: 'Sync All', exact: true }).click();
    await expect(page.getByText('1 record saved to GetRentos.')).toBeVisible();
    await expect.poll(() => queuedCount(page, binary)).toBe(0);
    expect(saved).toBe(1);
    if (binary) {
      expect(lastBody).toContain('original field evidence');
      expect(lastBody).toContain('evidence.txt');
    }
    await page.reload();
    await expect(page.getByText('No uploads waiting')).toBeVisible();
    expect(saved).toBe(1);
  });
}

test('draft and unverified server records are shown as saved, without fake sync buttons', async ({
  page,
}) => {
  await page.route('**/__qa_api/**', (route) =>
    route.fulfill({
      json: route.request().url().endsWith('/agent/sync')
        ? [
            {
              id: 'draft-1',
              recordType: 'inspection',
              recordLabel: 'Draft inspection',
              capturedAt: new Date().toISOString(),
              syncStatus: 'pending',
            },
            {
              id: 'visit-1',
              recordType: 'verification',
              recordLabel: 'Unchecked identity',
              capturedAt: new Date().toISOString(),
              syncStatus: 'pending',
            },
          ]
        : [],
    })
  );
  await page.goto('/agent/sync');
  await expect(page.getByText('Saved on server', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Sync All', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: /^(Sync|Retry)$/ })).toHaveCount(0);
});

test('reconnect and manual retry share one upload', async ({ page }) => {
  let allowSave = false;
  let saved = 0;
  let completeUpload: (() => void) | undefined;
  await page.route('**/__qa_api/**', async (route) => {
    if (route.request().method() !== 'POST') return route.fulfill({ json: [] });
    if (!allowSave)
      return route.fulfill({ status: 500, json: { message: 'Temporarily unavailable' } });
    saved++;
    await new Promise<void>((resolve) => {
      completeUpload = resolve;
    });
    await route.fulfill({ status: 201, json: { id: 'saved-1' } });
  });
  await seed(page, 'inspection');
  await page.goto('/agent/sync');
  await expect(page.getByText('Waiting to upload', { exact: true })).toBeVisible();
  allowSave = true;
  await page.getByRole('button', { name: 'Sync All', exact: true }).click();
  await expect.poll(() => saved).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  completeUpload!();
  await expect.poll(() => queuedCount(page, false)).toBe(0);
  await expect(page.getByText('No uploads waiting')).toBeVisible();
  expect(saved).toBe(1);
});
