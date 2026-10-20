import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

type Finding = { kind: 'console' | 'page-error' | 'request' | 'response'; message: string };
const ignoredRequestFailure = /ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i;
const slug = (path: string) =>
  path === '/'
    ? 'home'
    : path
        .replace(/^\//, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/-+$/, '') || 'page';

export async function auditVisualPage(page: Page, path: string, testInfo: TestInfo): Promise<void> {
  const findings: Finding[] = [];
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === 'error') findings.push({ kind: 'console', message: message.text() });
  };
  const onPageError = (error: Error) =>
    findings.push({ kind: 'page-error', message: error.message });
  const onRequestFailed = (request: {
    url: () => string;
    failure: () => { errorText: string } | null;
  }) => {
    const reason = request.failure()?.errorText ?? 'unknown failure';
    if (!ignoredRequestFailure.test(reason))
      findings.push({ kind: 'request', message: `${reason} ${request.url()}` });
  };
  const onResponse = (response: { status: () => number; url: () => string }) => {
    if (response.status() >= 500)
      findings.push({ kind: 'response', message: `${response.status()} ${response.url()}` });
  };
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('requestfailed', onRequestFailed);
  page.on('response', onResponse);
  try {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(
      new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[/?#]|$)`)
    );
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(
      /application error|internal server error/i
    );
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.evaluate(() => document.fonts.ready);
    // Auth and dashboard illustrations use staggered Framer Motion entrances.
    // Audit the settled UI, not a translucent intermediate animation frame.
    await page.waitForTimeout(1_200);
    const layout = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const documentWidth = document.documentElement.scrollWidth;
      const brokenImages = Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src || image.alt || '<unlabelled image>');
      const overflow = Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && (rect.right > viewportWidth + 2 || rect.left < -2))
        .slice(0, 10)
        .map(({ element, rect }) => ({
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        }));
      return {
        horizontalOverflow: Math.max(0, documentWidth - viewportWidth),
        brokenImages,
        overflow,
      };
    });
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blockingViolations = accessibility.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );
    const evidenceName = slug(path);
    const screenshot = await page.screenshot({
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
    await testInfo.attach(`${evidenceName}.png`, { body: screenshot, contentType: 'image/png' });
    await testInfo.attach(`${evidenceName}.audit.json`, {
      body: Buffer.from(
        JSON.stringify(
          { path, project: testInfo.project.name, layout, findings, blockingViolations },
          null,
          2
        )
      ),
      contentType: 'application/json',
    });
    if (process.env.E2E_VISUAL_COMPARE === '1')
      await expect(page).toHaveScreenshot(`${evidenceName}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.005,
      });
    expect(layout.horizontalOverflow, JSON.stringify(layout.overflow, null, 2)).toBeLessThanOrEqual(
      2
    );
    expect(layout.brokenImages, `Broken images on ${path}`).toEqual([]);
    expect(findings, `Browser failures on ${path}`).toEqual([]);
    expect(
      blockingViolations,
      `Serious accessibility violations on ${path}: ${blockingViolations.map((v) => `${v.id} (${v.nodes.length})`).join(', ')}`
    ).toEqual([]);
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('requestfailed', onRequestFailed);
    page.off('response', onResponse);
  }
}
