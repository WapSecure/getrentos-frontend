import { test, expect } from '@playwright/test';
import { accountFromEnv, expectHealthyPage, signIn } from './helpers/auth';

test('login screen is usable', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
});

const journeys = [
  {
    role: 'RENTER' as const,
    paths: ['/renter/dashboard', '/renter/applications', '/renter/payments', '/renter/bookings'],
  },
  {
    role: 'LANDLORD' as const,
    paths: [
      '/landlord/dashboard',
      '/landlord/applications',
      '/landlord/leases',
      '/landlord/payments',
      '/landlord/owner-statements',
      '/landlord/shortlets',
    ],
  },
  { role: 'OWNER' as const, paths: ['/owner/dashboard', '/owner/transactions'] },
  { role: 'REALTOR' as const, paths: ['/realtor/dashboard', '/realtor/commissions'] },
];

for (const journey of journeys) {
  const account = accountFromEnv(journey.role);
  test.describe(`${journey.role.toLowerCase()} revenue screens`, () => {
    test.skip(
      !account,
      `Set E2E_${journey.role}_EMAIL and E2E_${journey.role}_PASSWORD (or E2E_PASSWORD).`
    );

    test.beforeEach(async ({ page }) => signIn(page, account!));

    for (const path of journey.paths) {
      test(`${path} renders without server errors`, async ({ page }) => {
        await expectHealthyPage(page, path);
      });
    }
  });
}
