// Run: node tests/browser/showroom/fixture-api.mjs, then start web with
// SHOWROOM_ENABLED=on NEXT_PUBLIC_API_URL=http://localhost:4300, then node tests/browser/showroom/check.mjs
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.SHOWROOM_BASE_URL ?? 'http://localhost:3000';
const OUT = (process.env.SHOWROOM_SHOTS ?? os.tmpdir()) + path.sep;
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });
const desc = (page) => page.locator('[role="dialog"] p[aria-live="polite"]').textContent();

const browser = await chromium.launch();
try {
  // Desktop
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 140)));
  await page.goto(`${BASE}/rent/fx-rent-full`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.screenshot({ path: OUT + 'd-page.png' });
  check(
    'desktop: five mosaic tiles visible',
    (await page.locator('main button[aria-label^="Open"]:visible').count()) === 5
  );
  check(
    'desktop: facts include stored deposit/lease/pets',
    /Minimum lease[\s\S]*12 months/.test(await page.locator('main').innerText()) &&
      /Pets allowed\s*Yes/.test(await page.locator('main').innerText())
  );
  check(
    'desktop: cost total ₦4,700,000',
    /Stated costs to move in\s*₦4,700,000/.test(await page.locator('aside').innerText())
  );
  check(
    'desktop: fees not stated are named',
    /Not stated in this listing: service charge, agency fee and legal fee/.test(
      await page.locator('aside').innerText()
    )
  );
  check(
    'desktop: filmed-on-site disclosure',
    /Video filmed on site/.test(await page.locator('main').innerText())
  );

  const cover = page.locator('main button[aria-label^="Open gallery"]');
  await cover.click();
  await page.waitForTimeout(600);
  check('viewer: opens on photo 1 of 9', (await desc(page)) === 'Photo 1 of 9', await desc(page));
  await page.screenshot({ path: OUT + 'd-viewer.png' });
  await page.keyboard.press('ArrowRight');
  check('viewer: ArrowRight -> photo 2', (await desc(page)) === 'Photo 2 of 9');
  await page.keyboard.press('End');
  check(
    'viewer: End -> video 9 of 9',
    (await desc(page)) === 'Video tour 9 of 9',
    await desc(page)
  );
  await page.keyboard.press('Home');
  await page.keyboard.press('+');
  await page.waitForTimeout(300);
  const tf = await page.locator('[role="dialog"] img[draggable="false"]').getAttribute('style');
  check('viewer: + zooms to 1.5', /scale\(1\.5\)/.test(tf ?? ''), tf);
  await page.keyboard.press('0');
  check(
    'viewer: 0 resets zoom',
    /scale\(1\)/.test(
      (await page.locator('[role="dialog"] img[draggable="false"]').getAttribute('style')) ?? ''
    )
  );
  await page.getByRole('button', { name: 'Show all media' }).click();
  check(
    'viewer: grid shows all 9',
    (await page.locator('[aria-label="All media"] li').count()) === 9
  );
  await page.locator('[aria-label="All media"] li button').nth(3).click();
  check('viewer: grid pick -> photo 4', (await desc(page)) === 'Photo 4 of 9');
  // Tab stays inside the dialog and shows a ring
  await page.keyboard.press('Tab');
  const focusInside = await page.evaluate(
    () => !!document.activeElement?.closest('[role="dialog"]')
  );
  check('viewer: focus stays in dialog', focusInside);
  // Drag left = next (mouse drives pointer events)
  const stage = page.locator('[role="dialog"] img[draggable="false"]');
  const box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  check('viewer: swipe left -> next', (await desc(page)) === 'Photo 5 of 9', await desc(page));
  // Video plays through hls.js (Chromium has no native HLS)
  await page.locator('[aria-label="Thumbnails"] button[aria-label="Video tour 9"]').click();
  check('viewer: thumbnail -> video', (await desc(page)) === 'Video tour 9 of 9', await desc(page));
  await page.locator('[role="dialog"] button[aria-label$="video tour"]').click({ timeout: 8000 });
  await page.waitForTimeout(6000);
  const vid = await page.evaluate(() => {
    const v = document.querySelector('[role="dialog"] video');
    return v
      ? {
          ready: v.readyState,
          t: v.currentTime,
          paused: v.paused,
          src: (v.currentSrc || '').slice(0, 5),
        }
      : null;
  });
  check(
    // Bundled Chromium has no H.264: this proves hls.js attached; video-chrome.mjs checks playback.
    'video: hls.js attaches the stream',
    vid && vid.src === 'blob:',
    JSON.stringify(vid)
  );
  await page.screenshot({ path: OUT + 'd-video.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  check('viewer: Escape closes', (await page.locator('[role="dialog"]').count()) === 0);
  const back = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  check('viewer: focus returns to the cover', /^Open gallery/.test(back ?? ''), back);
  // Share dialog (desktop has no coarse pointer, so our dialog)
  await page.getByRole('button', { name: 'Share' }).click();
  const wa = await page.locator('[role="dialog"] a', { hasText: 'WhatsApp' }).getAttribute('href');
  check(
    'share: WhatsApp link carries the listing URL',
    /wa\.me\/\?text=.*%2Frent%2Ffx-rent-full/.test(wa ?? ''),
    wa?.slice(0, 80)
  );
  await page.keyboard.press('Escape');
  check(
    'desktop: no console errors',
    consoleErrors.filter((e) => !/picsum|99999999|Failed to load resource/.test(e)).length === 0,
    consoleErrors.join(' | ')
  );

  // Edge fixtures
  await page.goto(`${BASE}/rent/fx-rent-broken`, { waitUntil: 'networkidle' });
  await page.locator('main button[aria-label^="Open gallery"]').click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2500);
  check(
    'broken: viewer says the photo could not load',
    /This photo couldn’t load/.test(await page.locator('[role="dialog"]').innerText())
  );
  await page.keyboard.press('ArrowRight');
  check('broken: can move past it', (await desc(page)) === 'Photo 4 of 5');
  await page.keyboard.press('Escape');

  await page.goto(`${BASE}/rent/fx-rent-tagged`, { waitUntil: 'networkidle' });
  const aside = await page.locator('aside').innerText();
  check(
    'tagged: fees listed and totalled (₦6,140,000)',
    /Service charge\s*₦600,000/.test(aside) &&
      /Agency fee\s*₦420,000/.test(aside) &&
      /Legal fee\s*₦420,000/.test(aside) &&
      /Stated costs to move in\s*₦6,140,000/.test(aside),
    aside.slice(0, 300)
  );
  check('tagged: nothing listed as not stated', !/Not stated in this listing/.test(aside));
  check(
    'tagged: room shortcuts under the hero',
    (await page.locator('nav[aria-label="Photos by room"] button').count()) === 5
  );
  await page.locator('nav[aria-label="Photos by room"] button', { hasText: 'Kitchen' }).click();
  await page.waitForTimeout(500);
  check(
    'tagged: room shortcut opens on the kitchen',
    (await desc(page)) === 'Photo 3 of 10 · Kitchen',
    await desc(page)
  );
  const overlay = await page.locator('[role="dialog"]').innerText();
  check(
    'tagged: room name and caption over the photo',
    /Kitchen/.test(overlay) && /Open kitchen with a gas hob/.test(overlay)
  );
  check(
    'tagged: room rail lists the rooms',
    (await page.locator('[role="dialog"] nav[aria-label="Rooms"] button').count()) === 5
  );
  await page.keyboard.press('End');
  check('tagged: 360 tour is last', (await desc(page)) === '360 tour 10 of 10', await desc(page));
  check(
    'tagged: tour asks before loading',
    (await page.locator('[role="dialog"] iframe').count()) === 0 &&
      (await page.getByRole('button', { name: /Open the 360 tour/ }).count()) === 1
  );
  await page.getByRole('button', { name: /Open the 360 tour/ }).click();
  check(
    'tagged: tour frame from the allowed host',
    /^https:\/\/kuula\.co\//.test(
      (await page.locator('[role="dialog"] iframe').getAttribute('src')) ?? ''
    )
  );
  await page.screenshot({ path: OUT + 'd-tagged.png' });
  await page.keyboard.press('Escape');

  await page.goto(`${BASE}/rent/fx-rent-empty`, { waitUntil: 'networkidle' });
  check(
    'empty: placeholder, no viewer button',
    /Photos are being prepared/.test(await page.locator('main').innerText()) &&
      (await page.locator('main button[aria-label^="Open gallery"]').count()) === 0
  );
  check(
    'empty: deposit listed as not stated',
    /Not stated in this listing: service charge, agency fee, legal fee and security deposit/.test(
      await page.locator('aside').innerText()
    )
  );

  await page.goto(`${BASE}/rent/fx-rent-many`, { waitUntil: 'networkidle' });
  check(
    'many: chip says 40 photos',
    (await page.getByRole('button', { name: 'Show all 40 photos' }).count()) === 1
  );
  await page.getByRole('button', { name: 'Show all 40 photos' }).click();
  check(
    'many: 40 thumbnails',
    (await page.locator('[aria-label="Thumbnails"] button').count()) === 40
  );
  await page.keyboard.press('ArrowLeft');
  check('many: wraps to last', (await desc(page)) === 'Photo 40 of 40');
  await page.keyboard.press('Escape');

  await page.goto(`${BASE}/rent/fx-rent-legacy`, { waitUntil: 'networkidle' });
  check(
    'legacy API (no media list): 3 photos from old fields',
    (await page.getByRole('button', { name: 'Show all 3 photos' }).count()) === 1
  );

  await page.goto(`${BASE}/buy/fx-sale`, { waitUntil: 'networkidle' });
  const saleText = await page.locator('main').innerText();
  check('sale: not verified is said plainly', /Not verified yet/.test(saleText));
  check(
    'sale: video chip, no filmed-on-site claim',
    (await page.getByRole('button', { name: 'Video tour' }).count()) === 1 &&
      !/Video filmed on site/.test(saleText)
  );
  check(
    'sale: asking price only, fees named',
    /Asking price\s*₦185,000,000/.test(await page.locator('aside').innerText()) &&
      /legal fee, agency fee and survey and registration costs/.test(
        await page.locator('aside').innerText()
      )
  );
  await page.screenshot({ path: OUT + 'd-sale.png' });

  await page.goto(`${BASE}/land/fx-land`, { waitUntil: 'networkidle' });
  const landText = await page.locator('main').innerText();
  check(
    'land: title label and diligence label',
    /Certificate of Occupancy/.test(landText) &&
      /Due diligence\s*Verified/.test(landText) &&
      /Area\s*648 sqm/.test(landText)
  );
  check('land: ownership-verified wording', /Ownership verified by Sureground/.test(landText));
  await ctx.close();

  // Phone, reduced motion, layout shift
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const p = await phone.newPage();
  await p.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) =>
      l.getEntries().forEach((e) => {
        if (!e.hadRecentInput) window.__cls += e.value;
      })
    ).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => {
      const e = l.getEntries().at(-1);
      window.__lcp = {
        t: Math.round(e.startTime),
        el: e.element?.tagName,
        src: (e.element?.currentSrc || '').slice(0, 40),
      };
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await p.goto(`${BASE}/rent/fx-rent-full`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const perf = await p.evaluate(() => ({
    cls: Number(window.__cls.toFixed(3)),
    lcp: window.__lcp,
    scrollW: document.documentElement.scrollWidth,
  }));
  check('phone: no horizontal scroll', perf.scrollW <= 390, String(perf.scrollW));
  check('phone: CLS <= 0.1 (dev server)', perf.cls <= 0.1, JSON.stringify(perf));
  check(
    'phone: price shown above the fold area',
    await p.locator('header p.data-value').isVisible()
  );
  await p.screenshot({ path: OUT + 'm-page.png' });
  const strip = p.locator('main [aria-label="Photos"]');
  await strip.evaluate((el) => el.scrollTo({ left: el.clientWidth * 2 }));
  await p.waitForTimeout(500);
  check(
    'phone: swipe strip counter follows',
    /3 \/ 8/.test(await p.getByRole('button', { name: 'Show all 8 photos' }).innerText())
  );
  await p.getByRole('button', { name: 'Show all 8 photos' }).tap();
  await p.waitForTimeout(400);
  check(
    'phone: viewer opens on the photo in view',
    (await p.locator('[role="dialog"] p[aria-live="polite"]').textContent()) === 'Photo 3 of 9'
  );
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  await strip.locator('button').first().tap();
  await p.waitForTimeout(400);
  const boxes = await p.evaluate(() =>
    [...document.querySelectorAll('[role="toolbar"] button')]
      .filter((b) => b.offsetParent)
      .map((b) => Math.round(b.getBoundingClientRect().height))
  );
  check(
    'phone: controls are >= 44px',
    boxes.every((h) => h >= 44),
    boxes.join(',')
  );
  await p.screenshot({ path: OUT + 'm-viewer.png' });
  await phone.close();
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
for (const r of results)
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  (${r.detail})`}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
