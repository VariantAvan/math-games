// Every skill fits phones, tablets and laptops: big tap targets, nothing off screen, no sideways scroll.
const { test } = require('@playwright/test');
const { openApp, force, expect } = require('./helpers');

const VIEWPORTS = {
  'small phone': { width: 360, height: 640 },
  'phone': { width: 390, height: 844 },
  'phone landscape': { width: 667, height: 375 },
  'tablet portrait': { width: 768, height: 1024 },
  'tablet landscape': { width: 1024, height: 768 },
  'laptop': { width: 1440, height: 900 },
};
const SKILLS = ['numbers', 'letters', 'counting', 'starts', 'addition', 'subtraction', 'jumble', 'compare', 'pattern', 'shapes'];

for (const [name, vp] of Object.entries(VIEWPORTS)) {
  test(`${name}: all 10 skills fit with big tap targets`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(vp);
    await openApp(page);
    for (const id of SKILLS) {
      await force(page, id);
      await page.waitForTimeout(700); // let the pop-in animations settle
      const m = await page.evaluate(() => {
        const vw = window.innerWidth, vh = window.innerHeight;
        const rect = (el) => el.getBoundingClientRect();
        const targets = [...document.querySelectorAll('#answers .card, #answers .tile')].map(rect);
        const promptKids = [...document.querySelectorAll('#prompt > *')].map(rect);
        const off = (r) => r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1;
        return {
          overflowX: document.documentElement.scrollWidth - vw,
          smallest: Math.min(...targets.map((r) => Math.min(r.width, r.height))),
          targetsOff: targets.filter(off).length,
          promptOff: promptKids.filter(off).length,
          overlap: targets.some((r) => promptKids.some((p) => p.bottom > r.top + 2 && p.top < r.bottom && p.right > r.left && p.left < r.right)),
          replay: rect(document.getElementById('replayBtn')).width,
        };
      });
      expect(m.overflowX, `${id}: sideways scroll`).toBeLessThanOrEqual(0);
      expect(m.smallest, `${id}: smallest tap target`).toBeGreaterThanOrEqual(64);
      expect(m.targetsOff, `${id}: answers off screen`).toBe(0);
      expect(m.promptOff, `${id}: question off screen`).toBe(0);
      expect(m.overlap, `${id}: question overlaps answers`).toBe(false);
      expect(m.replay).toBeGreaterThanOrEqual(64);
    }
    await page.screenshot({ path: `test-results/screens/${name.replace(/ /g, '-')}.png` });
  });
}
