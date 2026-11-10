// Needs Google Chrome installed: Playwright's bundled Chromium has no H.264 decoder.
import { chromium } from '@playwright/test';

const BASE = process.env.SHOWROOM_BASE_URL ?? 'http://localhost:3000';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/rent/fx-rent-full`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Video tour' }).click();
  await page.locator('[role="dialog"] button[aria-label$="video tour"]').click();
  const played = await page
    .waitForFunction(
      () => (document.querySelector('[role="dialog"] video')?.currentTime ?? 0) > 1,
      null,
      {
        timeout: 20000,
      }
    )
    .then(() => true)
    .catch(() => false);
  const v = await page.evaluate(() => {
    const el = document.querySelector('[role="dialog"] video');
    return {
      t: Number(el.currentTime.toFixed(1)),
      src: el.currentSrc.slice(0, 5),
      error: el.error?.code ?? null,
    };
  });
  console.log(played ? 'PASS' : 'FAIL', ' video tour plays through hls.js', JSON.stringify(v));
} finally {
  await browser.close();
}
