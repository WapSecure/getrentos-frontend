import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { accountFromEnv, expectVisualHealth, sidebarPaths, signIn } from './helpers/auth';

test.setTimeout(240_000);

const account = accountFromEnv('ADMIN');

test.describe('admin complete sidebar', () => {
  test.skip(!account, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (or E2E_PASSWORD).');

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL as string,
      viewport: testInfo.project.use.viewport,
    });
    page = await context.newPage();
    await signIn(page, account!, true);
  });

  test.afterAll(async () => context?.close());

  test('every administration-menu destination is visually healthy', async () => {
    const discovered = await sidebarPaths(page, '/admin/dashboard');
    const paths = discovered.filter(
      (path) => path.startsWith('/admin/') && path !== '/admin/login'
    );
    expect(paths.length, 'No administration sidebar links were discovered').toBeGreaterThan(1);

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
