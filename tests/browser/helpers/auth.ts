import { expect, type Page } from '@playwright/test';

export type TestAccount = { email: string; password: string };

export function accountFromEnv(
  prefix:
    | 'RENTER'
    | 'LANDLORD'
    | 'OWNER'
    | 'REALTOR'
    | 'BUYER'
    | 'AGENT'
    | 'PROPERTY_MANAGER'
    | 'ESTATE'
    | 'RESIDENT'
    | 'GATEMAN'
    | 'ADMIN'
): TestAccount | null {
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`] ?? process.env.E2E_PASSWORD;
  return email && password ? { email, password } : null;
}

export async function signIn(page: Page, account: TestAccount, admin = false): Promise<void> {
  await page.goto(admin ? '/admin/login' : '/login');
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /\/auth\/(?:admin\/)?login(?:\?|$)/.test(response.url()),
      { timeout: 20_000 }
    ),
    page.getByRole('button', { name: admin ? /sign in/i : /^sign in$/i }).click(),
  ]);
  expect(loginResponse.ok(), `Login failed with HTTP ${loginResponse.status()}`).toBe(true);
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

export async function expectVisualHealth(page: Page, path: string): Promise<void> {
  await expectHealthyPage(page, path);

  const health = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const documentWidth = document.documentElement.scrollWidth;
    const brokenImages = Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt || '<unlabelled image>');
    const overflowingElements = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.right > viewportWidth + 2 || rect.left < -2)
      .slice(0, 8)
      .map(({ element, rect }) => ({
        element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${
          element.className && typeof element.className === 'string'
            ? `.${element.className.trim().split(/\s+/).slice(0, 4).join('.')}`
            : ''
        }`,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      }));

    return {
      horizontalOverflow: Math.max(0, documentWidth - viewportWidth),
      brokenImages,
      overflowingElements,
    };
  });

  expect(
    health.horizontalOverflow,
    `${path} overflows the viewport horizontally by ${health.horizontalOverflow}px: ${JSON.stringify(
      health.overflowingElements
    )}`
  ).toBeLessThanOrEqual(2);
  expect(health.brokenImages, `Broken images on ${path}`).toEqual([]);
}

export async function sidebarPaths(page: Page, dashboardPath: string): Promise<string[]> {
  await expectHealthyPage(page, dashboardPath);
  const paths = await page.locator('nav a[href]').evaluateAll((links) =>
    links
      .map((link) => link.getAttribute('href'))
      .filter((href): href is string => Boolean(href?.startsWith('/')))
      .map((href) => href.split('#')[0].split('?')[0])
  );

  return [...new Set([dashboardPath, ...paths])];
}
