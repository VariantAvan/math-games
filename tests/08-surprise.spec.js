// "Surprise me!" — random questions in both games.
const { test } = require('@playwright/test');
const { openApp, state, tapKey, waitForStep, expect } = require('./helpers');

for (const mode of ['addition', 'subtraction']) {
  test.describe(mode, () => {
    test.beforeEach(async ({ page }) => { await openApp(page, mode); });

    test('Surprise me! on step 1 fills in both numbers and goes to step 3', async ({ page }) => {
      await expect(page.locator('#randomBtn')).toContainText('Surprise me!');
      await page.locator('#randomBtn').click({ force: true });
      await waitForStep(page, 'answer');
      const s = await state(page);
      expect(s.num1).toBeGreaterThanOrEqual(1);
      expect(s.num2).toBeGreaterThanOrEqual(1);
      await expect(page.locator('#slot1')).toHaveText(String(s.num1));
      await expect(page.locator('#slot2')).toHaveText(String(s.num2));
      if (mode === 'addition') await expect(page.locator('#group2 .animal')).toHaveCount(s.num2);
      else await expect(page.locator('#group1 .animal.gone')).toHaveCount(s.num2);
      // the surprise button makes way for "Count with me!"
      await expect(page.locator('#randomBtn')).toBeHidden();
      await expect(page.locator('#countBtn')).toBeVisible();
      // and the question can be solved
      const ans = await page.evaluate(([m, a, b]) => window.ToddlerMath.answerFor(m, a, b), [mode, s.num1, s.num2]);
      for (const ch of String(ans)) await page.keyboard.press(ch);
      await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
    });

    test('on step 2 it becomes "Pick for me!" and keeps the first number', async ({ page }) => {
      await tapKey(page, '6');
      await waitForStep(page, 'num2');
      await expect(page.locator('#randomBtn')).toContainText('Pick for me!');
      await page.locator('#randomBtn').click({ force: true });
      await waitForStep(page, 'answer');
      const s = await state(page);
      expect(s.num1).toBe(6);
      expect(s.num2).toBeGreaterThanOrEqual(1);
      if (mode === 'subtraction') expect(s.num2).toBeLessThanOrEqual(6);
    });

    test('keyboard R also makes a surprise question', async ({ page }) => {
      await page.keyboard.press('r');
      await waitForStep(page, 'answer');
      expect((await state(page)).num1).not.toBeNull();
    });

    test('generated questions are always in range', async ({ page }) => {
      const qs = await page.evaluate((m) => Array.from({ length: 500 }, () => window.ToddlerMath.randomQuestion(m)), mode);
      for (const [a, b] of qs) {
        expect(a).toBeGreaterThanOrEqual(1);
        expect(a).toBeLessThanOrEqual(9);
        expect(b).toBeGreaterThanOrEqual(1);
        if (mode === 'addition') { expect(b).toBeLessThanOrEqual(9); expect(a + b).toBeLessThanOrEqual(18); }
        else { expect(b).toBeLessThanOrEqual(a); expect(a - b).toBeGreaterThanOrEqual(0); }
      }
      expect(new Set(qs.map((q) => q.join())).size).toBeGreaterThan(20); // plenty of variety
    });

    test('pressing it while animals are still appearing does nothing', async ({ page }) => {
      await tapKey(page, '3');
      await page.locator('#randomBtn').click({ force: true });
      await waitForStep(page, 'num2');
      expect((await state(page)).num2).toBeNull();
    });
  });
}
