import { test, type BrowserContext, type Page } from '@playwright/test';
import { accountFromEnv, signIn } from './helpers/auth';
import { auditVisualPage } from './helpers/visualQa';
import { personaRoutes, publicWebRoutes } from './helpers/visualRoutes';

test.setTimeout(90_000);
test.describe('public visual QA', () => {
  for (const path of publicWebRoutes)
    test(`${path} @visual`, async ({ page }, testInfo) => auditVisualPage(page, path, testInfo));
});
for (const persona of personaRoutes) {
  const account = accountFromEnv(persona.role);
  test.describe(`${persona.role.toLowerCase()} visual QA`, () => {
    test.describe.configure({ mode: 'serial' });
    test.skip(!account, `Set E2E_${persona.role}_EMAIL and a corresponding password.`);
    let context: BrowserContext;
    let page: Page;
    test.beforeAll(async ({ browser }, testInfo) => {
      context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL as string,
        viewport: testInfo.project.use.viewport,
        colorScheme: testInfo.project.use.colorScheme,
      });
      page = await context.newPage();
      await signIn(page, account!);
    });
    test.afterAll(async () => context?.close());
    for (const path of persona.routes)
      test(`${path} @visual`, async ({}, testInfo) => auditVisualPage(page, path, testInfo));
  });
}
