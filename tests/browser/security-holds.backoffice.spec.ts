import { createHmac } from 'crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Payout holds end to end: a rule holds a payout, the owner appeals, staff release or confirm.
 *
 * Needs an API started with RISK_ENFORCE_PAYOUT_RULES=true and, outside production only,
 * TRUST_TIER_GATE_DISABLED_CAPS=payouts (seeded accounts are below the payout trust tier).
 * Against an API without enforcement the tests skip.
 *
 *   E2E_API_URL, E2E_WEB_URL, E2E_BACKOFFICE_URL, E2E_MAILHOG_URL
 *   E2E_PASSWORD                     shared seeded password
 *   E2E_HOLD_RELEASE_EMAIL           a host-role account (e.g. seed-realtor) for the release path
 *   E2E_HOLD_CONFIRM_EMAIL           a different host-role account (e.g. seed-owner) for the confirm path
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_TOTP_SECRET
 *
 * Seeded test accounts only: each run sets their transaction PIN to a known test value.
 */

const api = process.env.E2E_API_URL;
const web = process.env.E2E_WEB_URL;
const mailhog = process.env.E2E_MAILHOG_URL;
const password = process.env.E2E_PASSWORD;
const releaseEmail = process.env.E2E_HOLD_RELEASE_EMAIL;
const confirmEmail = process.env.E2E_HOLD_CONFIRM_EMAIL;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const totpSecret = process.env.E2E_ADMIN_TOTP_SECRET;
const PIN = '480126';

test.describe.configure({ mode: 'serial' });
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'backoffice', 'Runs once, on the light backoffice project');
  test.skip(
    !api ||
      !web ||
      !mailhog ||
      !password ||
      !releaseEmail ||
      !confirmEmail ||
      !adminEmail ||
      !totpSecret,
    'Needs the hold settings listed at the top of this file'
  );
});

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

// The API refuses a spent code for 90 s, so every code this file sends comes from a window not used before.
const usedWindows = new Set<number>();
async function freshCode(page: Page): Promise<string> {
  // A run started right after another may share its window, so the first code waits for a new one.
  if (usedWindows.size === 0) usedWindows.add(Math.floor(Date.now() / 30_000));
  while (usedWindows.has(Math.floor(Date.now() / 30_000))) {
    await page.waitForTimeout(30_000 - (Date.now() % 30_000) + 1_000);
  }
  const at = Date.now();
  usedWindows.add(Math.floor(at / 30_000));
  return totp(totpSecret!, at);
}

async function latestCode(request: APIRequestContext, to: string): Promise<string> {
  let code: string | undefined;
  await expect
    .poll(
      async () => {
        const res = await request.get(
          `${mailhog}/api/v2/search?kind=to&query=${encodeURIComponent(to)}&limit=1`
        );
        const body = (await res.json()) as { items: { Content: { Body: string } }[] };
        code = body.items[0]?.Content.Body.replace(/=\r?\n/g, '').match(/\b(\d{6})\b/)?.[1];
        return code;
      },
      { timeout: 20_000 }
    )
    .toBeTruthy();
  return code!;
}

async function signInApi(request: APIRequestContext, email: string): Promise<string> {
  const res = await request.post(`${api}/auth/login`, { data: { identifier: email, password } });
  expect(res.ok(), `sign-in for ${email}`).toBe(true);
  return ((await res.json()) as { accessToken: string }).accessToken;
}

/** Sets a known PIN the way a person would: password plus a code sent to them. */
async function ensurePin(request: APIRequestContext, email: string): Promise<string> {
  const token = await signInApi(request, email);
  const auth = { Authorization: `Bearer ${token}` };
  const sent = await request.post(`${api}/users/me/security/step-up/code`, { headers: auth });
  const { reference } = (await sent.json()) as { reference: string };
  const code = await latestCode(request, email);
  const set = await request.post(`${api}/users/me/security/transaction-pin`, {
    headers: auth,
    data: { currentPassword: password, pin: PIN, reference, code },
  });
  expect(set.ok(), 'set PIN').toBe(true);
  return token;
}

/** Up to four confirmed payout requests; the velocity rule holds the one after three in a day. */
async function requestUntilHeld(request: APIRequestContext, token: string): Promise<boolean> {
  const auth = { Authorization: `Bearer ${token}` };
  for (let i = 0; i < 4; i++) {
    let res = await request.post(`${api}/host/shortlets/payouts/request`, {
      headers: auth,
      data: {},
    });
    let body = (await res.json()) as { error?: string; challengeId?: string };
    if (res.status() === 403 && body.error === 'STEP_UP_REQUIRED') {
      const confirm = await request.post(`${api}/users/me/security/step-up`, {
        headers: auth,
        data: { pin: PIN, challengeId: body.challengeId },
      });
      const { stepUpToken } = (await confirm.json()) as { stepUpToken: string };
      res = await request.post(`${api}/host/shortlets/payouts/request`, {
        headers: { ...auth, 'x-step-up-token': stepUpToken },
        data: {},
      });
      body = (await res.json()) as { error?: string };
    }
    if (res.status() === 409 && body.error === 'PAYOUT_HELD_FOR_REVIEW') return true;
  }
  return false;
}

async function staffSignIn(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill(adminEmail!);
  await page.locator('input[type="password"]').fill(password!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByLabel('Authentication code').fill(await freshCode(page));
  await page.getByRole('button', { name: /Verify/ }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

/** Needs review lists the newest case first, so its controls are the first on the page. */
function newestCase(page: Page) {
  return {
    note: page.locator('textarea').first(),
    release: page.getByRole('button', { name: 'Release payout' }).first(),
    confirm: page.getByRole('button', { name: 'Confirm and open a fraud alert' }).first(),
  };
}

test.describe('payout holds: appeal and staff review', () => {
  test('the owner appeals, and staff release the hold with a reason and step-up', async ({
    page,
    request,
    browser,
  }) => {
    test.setTimeout(180_000);
    const token = await ensurePin(request, releaseEmail!);
    test.skip(
      !(await requestUntilHeld(request, token)),
      'No hold produced: the API is not enforcing holds, or this account was released in the last 72 hours'
    );

    // The held person tells their side from the Security Centre.
    const userContext = await browser.newContext({ baseURL: web });
    const user = await userContext.newPage();
    await user.goto('/login');
    await user.locator('input[type="email"]').fill(releaseEmail!);
    await user.locator('input[type="password"]').fill(password!);
    await user.getByRole('button', { name: /^sign in$/i }).click();
    await expect(user).not.toHaveURL(/\/login/, { timeout: 20_000 });
    // Sign-in lands on the person's own dashboard, which names their portal.
    const portal = new URL(user.url()).pathname.split('/')[1];
    await user.goto(`/${portal}/settings`);
    await user.getByRole('button', { name: 'Security' }).click();
    await expect(user.getByRole('heading', { name: 'Paused payouts' })).toBeVisible();
    await user
      .getByLabel('Tell us your side')
      .first()
      .fill('These were my own requests while setting up payouts.');
    await user.getByRole('button', { name: 'Send to the team' }).first().click();
    await expect(user.getByText(/You told us:/).first()).toBeVisible();
    await userContext.close();

    // Staff see the appeal and release.
    await staffSignIn(page);
    await page.goto('/admin/fraud/risk');
    await page.getByRole('tab', { name: 'Needs review' }).click();
    const card = newestCase(page);
    await expect(
      page.getByText('These were my own requests while setting up payouts.').first()
    ).toBeVisible();
    await card.note.fill('Called the user; the requests were their own.');
    await card.release.click();
    const dialog = page.getByRole('dialog', { name: /Confirm it/ });
    await expect(dialog).toBeVisible();
    await dialog
      .locator('input')
      .first()
      .fill(await freshCode(page));
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog).toHaveCount(0);

    await page.getByRole('tab', { name: 'Flagged' }).click();
    await expect(
      page.getByText(/Released · .* · Called the user; the requests were their own\./).first()
    ).toBeVisible();

    // Sent just after the response, and other mail (a new sign-in alert) can land around it.
    await expect
      .poll(
        async () => {
          const res = await request.get(
            `${mailhog}/api/v2/search?kind=to&query=${encodeURIComponent(releaseEmail!)}&limit=10`
          );
          const { items } = (await res.json()) as {
            items: { Content: { Headers: { Subject: string[] } } }[];
          };
          return items.map((m) => m.Content.Headers.Subject[0]);
        },
        { timeout: 20_000 }
      )
      .toContain('Your Sureground payout check is done');
  });

  test('staff confirm a hold, which opens a high-severity fraud alert', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const token = await ensurePin(request, confirmEmail!);
    test.skip(
      !(await requestUntilHeld(request, token)),
      'No hold produced: the API is not enforcing holds, or this account was released in the last 72 hours'
    );

    await staffSignIn(page);
    await page.goto('/admin/fraud/risk');
    await page.getByRole('tab', { name: 'Needs review' }).click();
    const card = newestCase(page);
    await expect(card.release).toBeVisible();

    // A reason is required before either action.
    await expect(card.release).toBeDisabled();
    await expect(card.confirm).toBeDisabled();
    await card.note.fill('too short');
    await expect(card.confirm).toBeDisabled();

    await card.note.fill('Bank change and new device in one hour; no answer from the owner.');
    await card.confirm.click();
    const dialog = page.getByRole('dialog', { name: /Confirm it/ });
    await dialog
      .locator('input')
      .first()
      .fill(await freshCode(page));
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog).toHaveCount(0);

    await page.getByRole('tab', { name: 'Flagged' }).click();
    await expect(page.getByText('Confirmed: fraud alert opened').first()).toBeVisible();
    await page.goto('/admin/fraud');
    await expect(page.getByText(/Payout hold confirmed/).first()).toBeVisible();
  });
});
