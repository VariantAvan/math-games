// Cross-cutting — layout on phone/tablet/laptop, tap targets, theme, sound toggle.
const { test } = require('@playwright/test');
const { openApp, state, tapKey, setUpSum, expect } = require('./helpers');

const VIEWPORTS = {
  'phone portrait': { width: 375, height: 667 },
  'phone landscape': { width: 667, height: 375 },
  'tablet portrait': { width: 768, height: 1024 },
  'tablet landscape': { width: 1024, height: 768 },
  'small phone': { width: 360, height: 640 },
  'laptop': { width: 1440, height: 900 },
};

for (const [name, vp] of Object.entries(VIEWPORTS)) {
  test(`${name}: keys ≥ 64px, no horizontal scroll, everything on screen with 9 + 9`, async ({ page }) => {
    await page.setViewportSize(vp);
    await openApp(page);
    await setUpSum(page, 9, 9);
    const keys = await page.locator('#pad .key').evaluateAll((ks) => ks.map((k) => k.getBoundingClientRect()).map((r) => [r.width, r.height]));
    expect(keys).toHaveLength(12);
    for (const [w, h] of keys) { expect(w).toBeGreaterThanOrEqual(64); expect(h).toBeGreaterThanOrEqual(64); }
    const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflowX).toBeLessThanOrEqual(0);
    for (const sel of ['#pad', '#equation', '#group1', '#group2']) {
      const box = await page.locator(sel).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);
    }
    // every animal is at least 30px to tap and sits fully inside its own group card
    const animals = await page.locator('.animal').evaluateAll((as) => as.map((a) => {
      const r = a.getBoundingClientRect();
      const g = a.closest('.group').getBoundingClientRect();
      return { w: r.width, inside: r.left >= g.left && r.right <= g.right && r.top >= g.top && r.bottom <= g.bottom };
    }));
    expect(animals).toHaveLength(18);
    for (const a of animals) {
      expect(a.w).toBeGreaterThanOrEqual(30);
      expect(a.inside).toBe(true);
    }
    // "Count with me!" is a full-width row at the bottom of the number pad
    const pad = await page.locator('#pad').boundingBox();
    const cb = await page.locator('#countBtn').boundingBox();
    const lowestKey = Math.max(...(await page.locator('#pad .key').evaluateAll((ks) => ks.map((k) => k.getBoundingClientRect().bottom))));
    expect(cb.y).toBeGreaterThanOrEqual(lowestKey);
    expect(cb.x).toBeGreaterThanOrEqual(pad.x);
    expect(cb.x + cb.width).toBeLessThanOrEqual(pad.x + pad.width + 1);
    expect(cb.y + cb.height).toBeLessThanOrEqual(pad.y + pad.height + 1);
    expect(cb.width).toBeGreaterThan(pad.width * 0.8);
    expect(cb.height).toBeGreaterThanOrEqual(52);
    await page.screenshot({ path: `test-results/screens/${name.replace(/ /g, '-')}.png` });
  });
}

test('theme picker changes the animal and remembers it', async ({ page }) => {
  await openApp(page);
  await tapKey(page, '2');
  await page.locator('#themeBtn').click();
  await expect(page.locator('#themeSheet')).toBeVisible();
  await page.locator('.theme-opt[data-theme="duck"]').click();
  await page.locator('#closeTheme').click();
  await expect(page.locator('#group1 .animal .face').first()).toHaveText('🦆');
  await page.reload(); // URL is now …#addition, so the reload lands straight in the game
  await page.waitForFunction(() => window.ToddlerMath && window.ToddlerMath.getState().screen === 'addition');
  expect((await state(page)).theme).toBe('duck');
  expect((await state(page)).animal).toBe('duck');
});

test('random theme picks a different animal on each new round', async ({ page }) => {
  await openApp(page);
  const seen = new Set();
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.ToddlerMath.reset());
    seen.add((await state(page)).animal);
  }
  expect(seen.size).toBeGreaterThan(1);
});

test('sound toggle mutes all synthesized audio', async ({ page }) => {
  await openApp(page);
  await page.locator('#soundBtn').click();
  await expect(page.locator('#soundBtn')).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => { window.ToddlerMath.soundLog.length = 0; });
  await tapKey(page, '3');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.ToddlerMath.soundLog.length)).toBe(0);
});

test('restart button starts over mid-round', async ({ page }) => {
  await openApp(page);
  await setUpSum(page, 4, 1);
  await page.locator('#restartBtn').click();
  expect((await state(page)).step).toBe('num1');
  await expect(page.locator('.animal')).toHaveCount(0);
});
