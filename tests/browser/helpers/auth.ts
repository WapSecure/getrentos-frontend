import { expect, type Page } from '@playwright/test';

export type TestAccount = { email: string; password: string };

export function accountFromEnv(
  prefix: 'RENTER' | 'LANDLORD' | 'OWNER' | 'REALTOR' | 'ADMIN'
): TestAccount | null {
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`] ?? process.env.E2E_PASSWORD;
  return email && password ? { email, password } : null;
}

export async function signIn(page: Page, account: TestAccount, admin = false): Promise<void> {
  await page.goto(admin ? '/admin/login' : '/login');
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole('button', { name: admin ? /sign in/i : /^sign in$/i }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
}

export async function expectHealthyPage(page: Page, path: string): Promise<void> {
  const serverErrors: string[] = [];
  const onResponse = (response: { status: () => number; url: () => string }) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  };
  page.on('response', onResponse);
  await page.goto(path);
  await expect(page).toHaveURL(
    new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[/?#]|$)`)
  );
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  page.off('response', onResponse);
  expect(serverErrors, `5xx responses while opening ${path}`).toEqual([]);
}
