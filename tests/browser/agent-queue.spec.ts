import { test, expect, type Page } from '@playwright/test';

test.setTimeout(90_000);
const textQueueKey = 'sureground.agent.offline-queue';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('sureground_auth_token')) return;
    const token = `test.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.test`;
    localStorage.setItem('sureground_auth_token', token);
    localStorage.setItem(
      'sureground_user',
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
        ownerId: 'agent-queue-test',
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
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByText('Upload could not be completed')).toBeVisible();
    expect(await queuedCount(page, binary)).toBe(1);

    allowSave = true;
    await page.getByRole('button', { name: 'Sync All', exact: true }).click();
    await expect(page.getByText('1 record saved to Sureground.')).toBeVisible();
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

async function switchAccount(page: Page, id: string) {
  await page.evaluate((id) => {
    const user = JSON.parse(localStorage.getItem('sureground_user')!);
    localStorage.setItem('sureground_user', JSON.stringify({ ...user, id }));
    localStorage.setItem(
      'sureground_auth_token',
      `test.${btoa(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 }))}.test`
    );
    window.dispatchEvent(new Event('storage'));
  }, id);
}

async function changeSeedOwner(page: Page, binary: boolean, ownerId: string | null) {
  await page.evaluate(
    async ({ binary, ownerId, textQueueKey }) => {
      if (!binary) {
        const records = JSON.parse(localStorage.getItem(textQueueKey)!);
        records[0].ownerId = ownerId;
        localStorage.setItem(textQueueKey, JSON.stringify(records));
        return;
      }
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const open = indexedDB.open('getrentos-agent-offline', 1);
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('operations', 'readwrite');
        const store = tx.objectStore('operations');
        const read = store.get('queued-1');
        read.onsuccess = () => store.put({ ...read.result, ownerId });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    },
    { binary, ownerId, textQueueKey }
  );
}

for (const binary of [false, true]) {
  test(`${binary ? 'file' : 'text'} queue excludes another agent and becomes available to its owner`, async ({
    page,
  }) => {
    let attempts = 0;
    await page.route('**/__qa_api/**', async (route) => {
      if (route.request().method() === 'POST') {
        attempts++;
        return route.fulfill({ status: 201, json: { id: 'saved-1' } });
      }
      return route.fulfill({ json: [] });
    });
    await seed(page, binary ? 'document' : 'message', binary);
    await changeSeedOwner(page, binary, 'another-agent');
    await page.goto('/agent/sync');
    await expect(page.getByText('No uploads waiting')).toBeVisible();
    expect(attempts).toBe(0);
    expect(await queuedCount(page, binary)).toBe(1);
    await switchAccount(page, 'another-agent');
    await page.reload();
    await expect.poll(() => attempts).toBe(1);
    await expect.poll(() => queuedCount(page, binary)).toBe(0);
  });

  test(`${binary ? 'file' : 'text'} legacy records are retained for account review`, async ({
    page,
  }) => {
    let writes = 0;
    await page.route('**/__qa_api/**', (route) => {
      if (route.request().method() === 'POST') writes++;
      return route.fulfill({ json: [] });
    });
    await seed(page, binary ? 'document' : 'inspection', binary);
    await changeSeedOwner(page, binary, null);
    await page.goto('/agent/sync');
    await expect(page.getByText('Older uploads need account review')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sync All', exact: true })).toBeDisabled();
    expect(await queuedCount(page, binary)).toBe(1);
    expect(writes).toBe(0);
  });
}

test('account switch during a refused upload stops refresh and retains the original queue', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let writes = 0;
  let refreshes = 0;
  await page.route('**/__qa_api/**', async (route) => {
    if (route.request().url().includes('/auth/refresh')) {
      refreshes++;
      return route.fulfill({ status: 401, json: {} });
    }
    if (route.request().method() === 'POST') {
      writes++;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return route.fulfill({ status: 401, json: { message: 'Session expired' } });
    }
    return route.fulfill({ json: [] });
  });
  await seed(page, 'inspection');
  await page.goto('/agent/sync');
  await expect.poll(() => writes).toBe(1);
  await switchAccount(page, 'different-agent');
  release!();
  await page.reload();
  await expect(page.getByText('No uploads waiting')).toBeVisible();
  expect(await queuedCount(page, false)).toBe(1);
  expect(writes).toBe(1);
  expect(refreshes).toBe(0);
});

test('two tabs serialize replay of a shared device record', async ({ page, context }) => {
  let allowSave = false;
  let writes = 0;
  let release: (() => void) | undefined;
  await context.route('**/__qa_api/**', async (route) => {
    if (route.request().method() !== 'POST') return route.fulfill({ json: [] });
    if (!allowSave) return route.fulfill({ status: 403, json: { message: 'Not yet available' } });
    writes++;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return route.fulfill({ status: 201, json: { id: 'saved-1' } });
  });
  await seed(page, 'inspection');
  await page.goto('/agent/sync');
  await expect(page.getByText('Waiting to upload', { exact: true })).toBeVisible();
  allowSave = true;
  await page.getByRole('button', { name: 'Sync All', exact: true }).click();
  await expect.poll(() => writes).toBe(1);
  const second = await context.newPage();
  await second.goto('/agent/sync');
  await expect(second.getByText('Waiting to upload', { exact: true })).toBeVisible();
  release!();
  await expect.poll(() => queuedCount(second, false)).toBe(0);
  await expect(second.getByText('No uploads waiting')).toBeVisible();
  expect(writes).toBe(1);
  await second.close();
});

test('the original agent can refresh an expired token and finish the upload', async ({ page }) => {
  let writes = 0;
  let refreshes = 0;
  const token = `test.${Buffer.from(JSON.stringify({ sub: 'agent-queue-test', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64')}.test`;
  await page.route('**/__qa_api/**', (route) => {
    if (route.request().url().endsWith('/auth/refresh')) {
      refreshes++;
      return route.fulfill({ json: { accessToken: token } });
    }
    if (route.request().method() === 'POST') {
      writes++;
      return route.fulfill({
        status: writes === 1 ? 401 : 201,
        json: writes === 1 ? { message: 'Expired token' } : { id: 'saved-1' },
      });
    }
    return route.fulfill({ json: [] });
  });
  await seed(page, 'inspection');
  await page.goto('/agent/sync');
  await expect.poll(() => queuedCount(page, false)).toBe(0);
  await expect(page.getByText('No uploads waiting')).toBeVisible();
  expect(refreshes).toBe(1);
  expect(writes).toBe(2);
});

for (const type of ['inspection', 'verification', 'document', 'message']) {
  for (const failure of ['refused', 'network']) {
    test(`${type} capture ${failure === 'network' ? 'queues with its owner on connection failure' : 'keeps the draft on server rejection'}`, async ({
      page,
    }) => {
      let writes = 0;
      await page.route('**/__qa_api/**', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname.replace('/__qa_api', '');
        if (request.method() === 'POST') {
          writes++;
          if (failure === 'network') return route.abort('connectionfailed');
          return route.fulfill({ status: 403, json: { message: 'This record is not permitted' } });
        }
        const empty = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
        if (path === '/agent/tasks')
          return route.fulfill({
            json: {
              ...empty,
              total: 1,
              items: [
                {
                  id: 'task-1',
                  type: type === 'inspection' ? 'INSPECTION' : 'VERIFICATION',
                  title: 'Capture field record',
                  status: 'ASSIGNED',
                  priority: 'MEDIUM',
                  dueAt: new Date().toISOString(),
                  property: {
                    title: 'QA Property',
                    address: 'QA Street',
                    city: 'Lagos',
                    state: 'Lagos',
                  },
                  assignedBy: { legalName: 'QA Owner', roles: [{ role: 'LANDLORD' }] },
                },
              ],
            },
          });
        if (path === '/agent/messages')
          return route.fulfill({
            json: {
              ...empty,
              total: 1,
              items: [
                {
                  id: 'conversation-1',
                  client: { legalName: 'Capture contact' },
                  lastMessage: '',
                  lastMessageAt: new Date().toISOString(),
                },
              ],
            },
          });
        return route.fulfill({
          json:
            path.includes('/notifications') ||
            path === '/agent/sync' ||
            path === '/agent/messages/conversation-1'
              ? []
              : empty,
        });
      });
      const withOtherOwner = type === 'verification' && failure === 'network';
      if (withOtherOwner) {
        await seed(page, 'inspection');
        await changeSeedOwner(page, false, 'another-agent');
      }
      const route =
        type === 'document' ? 'documents' : type === 'message' ? 'messages' : `${type}s`;
      await page.goto(
        `/agent/${route}${type === 'inspection' || type === 'verification' ? '?task=task-1' : ''}`
      );
      if (type === 'document') {
        await page.getByRole('button', { name: 'Upload Document', exact: true }).click();
        await page.locator('input[type=file]').setInputFiles({
          name: 'field-evidence.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('evidence for original agent'),
        });
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Upload Document', exact: true })
          .click();
      } else if (type === 'message') {
        await page.getByRole('button', { name: /Capture contact/ }).click();
        await page
          .getByRole('textbox', { name: 'Message', exact: true })
          .fill('Keep this field message');
        await page.getByRole('button', { name: 'Send message', exact: true }).click();
      } else if (type === 'inspection') {
        await page.getByPlaceholder('e.g. Living Room').fill('Field room');
        await page.getByRole('button', { name: 'Save Inspection', exact: true }).click();
      } else {
        await page.getByRole('textbox', { name: /Subject Name/ }).fill('Field subject');
        await page.getByRole('button', { name: 'Save Verification', exact: true }).click();
      }
      await expect.poll(() => writes).toBe(1);
      if (failure === 'refused') {
        if (type === 'message') {
          await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue(
            'Keep this field message'
          );
          await expect(page.getByText('Your draft is unchanged.', { exact: false })).toBeVisible();
        } else {
          await expect(page.getByRole('dialog')).toBeVisible();
          if (type === 'document')
            await expect(
              page.getByRole('dialog').getByText('field-evidence.txt', { exact: true })
            ).toBeVisible();
          if (type === 'inspection')
            await expect(page.getByPlaceholder('e.g. Living Room')).toHaveValue('Field room');
          if (type === 'verification')
            await expect(page.getByRole('textbox', { name: /Subject Name/ })).toHaveValue(
              'Field subject'
            );
        }
        expect(
          await page.evaluate(
            (key) => JSON.parse(localStorage.getItem(key) || '[]').length,
            textQueueKey
          )
        ).toBe(0);
      } else {
        await expect(page.getByText(/saved on this device/i)).toBeVisible();
        if (type === 'document') expect(await queuedCount(page, true)).toBe(1);
        else {
          const queued = await page.evaluate(
            (key) => JSON.parse(localStorage.getItem(key) || '[]'),
            textQueueKey
          );
          const owned = queued.filter(
            (item: { ownerId: string }) => item.ownerId === 'agent-queue-test'
          );
          expect(owned).toHaveLength(1);
          expect(owned[0]).toMatchObject({ type, ownerId: 'agent-queue-test' });
          expect(queued).toHaveLength(withOtherOwner ? 2 : 1);
        }
      }
    });
  }
}

test('a refused photo deletion leaves the inspection evidence visible', async ({ page }) => {
  await page.route('**/__qa_api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/__qa_api', '');
    if (request.method() === 'DELETE')
      return route.fulfill({ status: 403, json: { message: 'Photo removal is not permitted' } });
    if (path === '/agent/inspections/task-1/photos' && request.method() === 'POST') {
      return route.fulfill({
        status: 201,
        json: {
          id: 'photo-1',
          room: 'Evidence room',
          name: 'evidence.png',
          url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
        },
      });
    }
    const empty = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    if (path === '/agent/tasks')
      return route.fulfill({
        json: {
          ...empty,
          total: 1,
          items: [
            {
              id: 'task-1',
              type: 'INSPECTION',
              title: 'Inspection task',
              status: 'ASSIGNED',
              priority: 'MEDIUM',
              dueAt: new Date().toISOString(),
              property: { title: 'Property', address: 'Street', city: 'Lagos', state: 'Lagos' },
              assignedBy: { legalName: 'Owner', roles: [] },
            },
          ],
        },
      });
    return route.fulfill({ json: path.includes('/notifications') ? [] : empty });
  });
  await page.goto('/agent/inspections?task=task-1');
  await page.getByPlaceholder('e.g. Living Room').fill('Evidence room');
  await page
    .getByRole('dialog')
    .locator('input[type=file]')
    .setInputFiles({
      name: 'evidence.png',
      mimeType: 'image/png',
      buffer: Buffer.from('photo fixture'),
    });
  await expect(page.getByRole('img', { name: 'evidence.png', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove photo', exact: true }).click();
  await expect(page.getByText('Photo removal is not permitted', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'evidence.png', exact: true })).toBeVisible();
});
