import { test, expect, type BrowserContext, type Page } from '@playwright/test';
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
    test.describe.configure({ mode: 'serial' });
    test.skip(
      !account,
      `Set E2E_${journey.role}_EMAIL and E2E_${journey.role}_PASSWORD (or E2E_PASSWORD).`
    );

    let context: BrowserContext;
    let rolePage: Page;
    test.beforeAll(async ({ browser }, testInfo) => {
      context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL as string,
        viewport: testInfo.project.use.viewport,
      });
      rolePage = await context.newPage();
      await signIn(rolePage, account!);
    });
    test.afterAll(async () => context?.close());

    for (const path of journey.paths) {
      test(`${path} renders without server errors`, async () => {
        await expectHealthyPage(rolePage, path);
      });
    }
  });
}
