import { test, type BrowserContext, type Page } from '@playwright/test';
import { accountFromEnv, signIn } from './helpers/auth';
import { auditVisualPage } from './helpers/visualQa';
import { adminRoutes } from './helpers/visualRoutes';

test.setTimeout(90_000);
test('admin login @visual', async ({ page }, testInfo) =>
  auditVisualPage(page, '/admin/login', testInfo));
const account = accountFromEnv('ADMIN');
test.describe('authenticated admin visual QA', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!account, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (or E2E_PASSWORD).');
  let context: BrowserContext;
  let page: Page;
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL as string,
      viewport: testInfo.project.use.viewport,
      colorScheme: testInfo.project.use.colorScheme,
    });
    page = await context.newPage();
    await signIn(page, account!, true);
  });
  test.afterAll(async () => context?.close());
  for (const path of adminRoutes)
    test(`${path} @visual`, async ({}, testInfo) => auditVisualPage(page, path, testInfo));
});
