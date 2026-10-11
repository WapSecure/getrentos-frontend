import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { accountFromEnv, expectVisualHealth, sidebarPaths, signIn } from './helpers/auth';

test.setTimeout(240_000);

const roles = [
  { role: 'RENTER' as const, dashboard: '/renter/dashboard', prefix: '/renter/' },
  { role: 'LANDLORD' as const, dashboard: '/landlord/dashboard', prefix: '/landlord/' },
  { role: 'OWNER' as const, dashboard: '/owner/dashboard', prefix: '/owner/' },
  { role: 'REALTOR' as const, dashboard: '/realtor/dashboard', prefix: '/realtor/' },
];

for (const role of roles) {
  const account = accountFromEnv(role.role);

  test.describe(`${role.role.toLowerCase()} complete sidebar`, () => {
    test.skip(!account, `Set E2E_${role.role}_EMAIL and a corresponding password.`);

    let context: BrowserContext;
    let page: Page;

    test.beforeAll(async ({ browser }, testInfo) => {
      context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL as string,
        viewport: testInfo.project.use.viewport,
      });
      page = await context.newPage();
      await signIn(page, account!);
    });

    test.afterAll(async () => context?.close());

    test('every role-menu destination is visually healthy', async () => {
      const discovered = await sidebarPaths(page, role.dashboard);
      const paths = discovered.filter((path) => path.startsWith(role.prefix));
      expect(paths.length, `No ${role.role} sidebar links were discovered`).toBeGreaterThan(1);

      const failures: string[] = [];
      for (const path of paths) {
        try {
          await expectVisualHealth(page, path);
        } catch (error) {
          failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      expect(failures, failures.join('\n\n')).toEqual([]);
    });
  });
}
