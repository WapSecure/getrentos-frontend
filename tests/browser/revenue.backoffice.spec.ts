import { test, expect } from '@playwright/test';
import { accountFromEnv, expectHealthyPage, signIn } from './helpers/auth';

const account = accountFromEnv('ADMIN');

test('admin login screen is usable', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test.describe('authenticated revenue oversight screens', () => {
  test.skip(!account, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (or E2E_PASSWORD).');

  test.beforeEach(async ({ page }) => signIn(page, account!, true));

  for (const path of [
    '/admin/dashboard',
    '/admin/escrow',
    '/admin/disputes',
    '/admin/subscriptions',
    '/admin/rent-finance/payments',
    '/admin/rent-finance/statements',
    '/admin/rent-finance/payout-accounts',
    '/admin/shortlets',
    '/admin/marketplace',
  ]) {
    test(`${path} renders without server errors`, async ({ page }) => {
      await expectHealthyPage(page, path);
    });
  }
});
