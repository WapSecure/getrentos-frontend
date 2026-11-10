import { createHmac } from 'crypto';
import { expect, test, type Page } from '@playwright/test';
import { accountFromEnv, signIn } from './helpers/auth';

/**
 * Security flows end to end against a running local stack (API, web, backoffice, MailHog).
 *
 *   E2E_LANDLORD_EMAIL / E2E_PASSWORD   a landlord with a transaction PIN
 *   E2E_LANDLORD_PIN                    that PIN
 *   E2E_RENTER_EMAIL                    a renter, for the trust page
 *   E2E_API_URL                         e.g. http://127.0.0.1:4100
 *   E2E_MAILHOG_URL                     e.g. http://localhost:8025
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_TOTP_SECRET, E2E_BACKOFFICE_URL   for the staff check
 *
 * Each test skips when what it needs isn't set, and none of them uses real personal data.
 */

const landlord = accountFromEnv('LANDLORD');
const pin = process.env.E2E_LANDLORD_PIN;
const apiUrl = process.env.E2E_API_URL;
const mailhog = process.env.E2E_MAILHOG_URL;

test.describe.configure({ mode: 'serial' });
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'web-desktop', 'Runs once, on desktop web');
});

type MailItem = { Created: string; Content: { Headers: { Subject: string[] }; Body: string } };

async function mailSince(
  to: string,
  since: number,
  subject: RegExp
): Promise<MailItem | undefined> {
  const res = await fetch(
    `${mailhog}/api/v2/search?kind=to&query=${encodeURIComponent(to)}&limit=20`
  );
  const { items } = (await res.json()) as { items: MailItem[] };
  return items.find(
    (m) =>
      new Date(m.Created).getTime() >= since && subject.test(m.Content.Headers.Subject[0] ?? '')
  );
}

async function waitForMail(to: string, since: number, subject: RegExp): Promise<MailItem> {
  let found: MailItem | undefined;
  await expect
    .poll(async () => (found = await mailSince(to, since, subject)), { timeout: 20_000 })
    .toBeTruthy();
  return found!;
}

const codeIn = (mail: MailItem) => {
  const text = mail.Content.Body.replace(/=\r?\n/g, '');
  const match = text.match(/\b(\d{6})\b/);
  if (!match) throw new Error('No 6-digit code in the email');
  return match[1];
};

async function confirmWithPin(page: Page, value: string) {
  const dialog = page.getByRole('dialog', { name: /Confirm it/ });
  await expect(dialog).toBeVisible();
  await dialog.locator('input').first().fill(value);
  await dialog.getByRole('button', { name: 'Confirm' }).click();
}

function totp(secret: string, at = Date.now()): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of secret.replace(/=+$/, '').toUpperCase())
    bits += alphabet.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const hmac = createHmac('sha1', key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 15;
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

test.describe('security flows', () => {
  test.skip(!landlord || !mailhog, 'Needs E2E_LANDLORD_EMAIL, E2E_PASSWORD and E2E_MAILHOG_URL');

  test('a sign-in from a new device emails the owner and shows in Recent sign-ins', async ({
    browser,
  }) => {
    // A fresh context has an empty localStorage, so the app makes a new install id: a new device.
    const context = await browser.newContext();
    const page = await context.newPage();
    const since = Date.now() - 2_000;
    await signIn(page, landlord!);

    const mail = await waitForMail(
      landlord!.email,
      since,
      /New sign-in to your Sureground account/
    );
    expect(mail.Content.Body).toMatch(/signed in to from .+ on /);

    await page.goto('/landlord/settings');
    await page.getByRole('button', { name: 'Security' }).click();
    const recent = page
      .locator('div', { has: page.getByRole('heading', { name: 'Recent sign-ins' }) })
      .last();
    await expect(recent).toBeVisible();
    await expect(recent.getByText('New device').first()).toBeVisible();
    await context.close();
  });

  test('changing the sign-in email needs the PIN and a code sent to the new address', async ({
    page,
  }) => {
    test.skip(!pin, 'Needs E2E_LANDLORD_PIN');
    const original = landlord!.email;
    const changed = original.replace('@', `+e2e${Date.now() % 100000}@`);

    const change = async (to: string, expectWrongPinFirst: boolean) => {
      await page.goto('/landlord/settings');
      await page.getByRole('button', { name: 'Change email' }).click();
      await page.getByLabel('New email address').fill(to);
      const since = Date.now() - 2_000;
      await page.getByRole('button', { name: 'Send code' }).click();
      if (expectWrongPinFirst) {
        await confirmWithPin(page, '000000');
        await expect(page.getByRole('dialog', { name: /Confirm it/ })).toContainText(
          /wrong|incorrect|not right|try again/i
        );
      }
      await confirmWithPin(page, pin!);
      await expect(page.getByLabel('Verification code')).toBeVisible();
      const code = codeIn(await waitForMail(to, since, /./));
      await page.getByLabel('Verification code').fill(code);
      await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('input[type="email"]').first()).toHaveValue(to);
    };

    await signIn(page, landlord!);
    await change(changed, true);
    // Put the account back so the next run starts from the same place.
    await change(original, false);
  });

  test('a payout bank account cannot be changed without confirming it is you', async ({
    request,
  }) => {
    test.skip(!apiUrl, 'Needs E2E_API_URL');
    const login = await request.post(`${apiUrl}/auth/login`, {
      data: { identifier: landlord!.email, password: landlord!.password },
    });
    expect(login.ok()).toBe(true);
    const { accessToken } = (await login.json()) as { accessToken: string };

    const res = await request.put(`${apiUrl}/landlord/settings/payout`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { bankCode: '058', accountNumber: '0123456789' },
    });
    expect(res.status()).toBe(403);
    expect(((await res.json()) as { error: string }).error).toBe('STEP_UP_REQUIRED');
  });

  test('the trust page shows real statuses and what is not offered yet', async ({ page }) => {
    const renter = accountFromEnv('RENTER');
    test.skip(!renter, 'Needs E2E_RENTER_EMAIL');
    await signIn(page, renter!);
    await page.goto('/renter/trust-score');
    await expect(page.getByText('National ID (NIN)').first()).toBeVisible();
    await expect(page.getByText('Live selfie').first()).toBeVisible();
    await page.getByText('How this works').click();
    await expect(page.getByText('Not offered yet', { exact: true })).toBeVisible();
    await expect(page.getByText(/Address check:/)).toBeVisible();
  });

  test('staff see the new-device decision in Risk decisions', async ({ browser }) => {
    const admin = accountFromEnv('ADMIN');
    const secret = process.env.E2E_ADMIN_TOTP_SECRET;
    const backoffice = process.env.E2E_BACKOFFICE_URL;
    test.skip(
      !admin || !secret || !backoffice,
      'Needs E2E_ADMIN_EMAIL, E2E_ADMIN_TOTP_SECRET and E2E_BACKOFFICE_URL'
    );

    const context = await browser.newContext({ baseURL: backoffice });
    const page = await context.newPage();
    await page.goto('/admin/login');
    await page.locator('input[type="email"]').fill(admin!.email);
    await page.locator('input[type="password"]').fill(admin!.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByLabel('Authentication code').fill(totp(secret!));
    await page.getByRole('button', { name: /Verify/ }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

    await page.goto('/admin/fraud/risk');
    await expect(page.getByRole('heading', { name: 'Risk decisions' })).toBeVisible();
    await expect(page.getByText('Sign-in from a new device').first()).toBeVisible();
    await page.getByRole('tab', { name: 'Needs review' }).click();
    await expect(
      page.getByText(/Nothing waiting for review|Waiting for review/).first()
    ).toBeVisible();
    await context.close();
  });
});
