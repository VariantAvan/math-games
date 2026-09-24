// Difficulty levels 1–10: pickers, question generator, multi-digit entry, place-value blocks.
const { test } = require('@playwright/test');
const { APP_URL, openWelcome, openApp, state, tapKey, waitForStep, expect } = require('./helpers');

const setLevel = (page, lv) => page.evaluate((l) => window.ToddlerMath.setLevel(l), lv);
const type = async (page, text) => { for (const ch of text) await page.keyboard.press(ch); };

test.describe('pickers', () => {
  test('welcome screen shows levels 1–10 with level 3 selected by default', async ({ page }) => {
    await openWelcome(page);
    await expect(page.locator('.level-chip')).toHaveCount(10);
    await expect(page.locator('.level-chip[aria-checked="true"]')).toHaveText('3');
    await expect(page.locator('#levelDesc')).toContainText('Level 3: Two single-digit numbers');
  });

  test('choosing a level on the welcome screen carries into the game and is remembered', async ({ page }) => {
    await openWelcome(page);
    await page.locator('.level-chip[data-level="7"]').click();
    await expect(page.locator('#levelDesc')).toContainText('Level 7');
    await page.locator('.activity[data-activity="addition"]').click({ force: true });
    await expect(page.locator('#levelNum')).toHaveText('7');
    await page.reload();
    await page.waitForFunction(() => window.ToddlerMath && window.ToddlerMath.getState().screen === 'addition');
    expect((await state(page)).level).toBe(7);
  });

  test('in-game ⭐ button opens the level sheet; picking a level restarts the round', async ({ page }) => {
    await openApp(page);
    await tapKey(page, '4');
    await waitForStep(page, 'num2');
    await page.locator('#levelBtn').click();
    await expect(page.locator('#levelSheet')).toBeVisible();
    await expect(page.locator('.level-opt')).toHaveCount(10);
    await expect(page.locator('.level-opt[data-level="6"]')).toContainText('like 35 + 48');
    await page.locator('.level-opt[data-level="6"]').click();
    await expect(page.locator('#levelSheet')).toBeHidden();
    expect(await state(page)).toMatchObject({ level: 6, step: 'num1', num1: null });
    await expect(page.locator('#levelNum')).toHaveText('6');
  });

  test('level sheet examples use − in Take Away', async ({ page }) => {
    await openApp(page, 'subtraction');
    await page.locator('#levelBtn').click();
    await expect(page.locator('.level-opt[data-level="6"]')).toContainText('like 84 − 37');
    await page.keyboard.press('Escape');
    await expect(page.locator('#levelSheet')).toBeHidden();
  });
});

test.describe('question generator follows each level', () => {
  const digits = (n) => String(n).length;
  const RULES = {
    1: ([a, b]) => a >= 1 && a <= 4 && b >= 1 && b <= 4,
    2: ([a, b]) => Math.min(a, b) >= 1 && Math.min(a, b) <= 4 && Math.max(a, b) <= 9,
    3: ([a, b]) => a >= 1 && a <= 9 && b >= 1 && b <= 9,
    4: ([a, b]) => { const [big, small] = a > b ? [a, b] : [b, a]; return digits(big) === 2 && big % 10 < 5 && small >= 1 && small <= 9; },
    5: ([a, b]) => { const [big, small] = a > b ? [a, b] : [b, a]; return digits(big) === 2 && small >= 1 && small <= 9; },
    6: ([a, b]) => digits(a) === 2 && digits(b) === 2,
    7: ([a, b]) => [digits(a), digits(b)].sort().join() === '2,3',
    8: ([a, b]) => digits(a) === 3 && digits(b) === 3,
    9: ([a, b]) => [digits(a), digits(b)].sort().join() === '3,4',
    10: ([a, b]) => digits(a) === 4 && digits(b) === 4,
  };
  for (const mode of ['addition', 'subtraction']) {
    test(`${mode}: 400 questions per level all match the level rules`, async ({ page }) => {
      await openWelcome(page);
      for (let lv = 1; lv <= 10; lv++) {
        const qs = await page.evaluate(([m, l]) => Array.from({ length: 400 }, () => window.ToddlerMath.randomQuestion(m, l)), [mode, lv]);
        for (const q of qs) {
          expect(RULES[lv](q), `level ${lv}: ${q}`).toBe(true);
          if (mode === 'subtraction') expect(q[0], `level ${lv}: ${q} must not go negative`).toBeGreaterThanOrEqual(q[1]);
        }
        if (mode === 'addition' && [2, 4, 5, 7, 9].includes(lv)) {
          // the smaller-shaped number is sometimes first, sometimes second
          expect(new Set(qs.map(([a, b]) => a > b)).size).toBe(2);
        }
      }
    });
  }
});

test.describe('level 1 (tiny numbers)', () => {
  test('keys 5–9 are dimmed and refused; the second number can be 0–4', async ({ page }) => {
    await openApp(page);
    await setLevel(page, 1);
    await expect(page.locator('.key[data-key="5"]')).toHaveClass(/dim/);
    await tapKey(page, '7');
    expect((await state(page)).num1).toBeNull();
    await expect(page.locator('#prompt')).toContainText('1 to 4');
    await tapKey(page, '3');
    await waitForStep(page, 'num2');
    await expect(page.locator('.key[data-key="0"]')).not.toHaveClass(/dim/);
    await expect(page.locator('.key[data-key="6"]')).toHaveClass(/dim/);
    await tapKey(page, '4');
    await waitForStep(page, 'answer');
    await tapKey(page, '7');
    await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
  });
});

test.describe('big numbers (levels 4–10)', () => {
  test('level 5: typing 2 digits enters the number; place-value blocks show tens and ones', async ({ page }) => {
    await openApp(page);
    await setLevel(page, 5);
    await type(page, '47');
    await waitForStep(page, 'num2');
    expect((await state(page)).num1).toBe(47);
    await expect(page.locator('#group1 .pv-tens .blk')).toHaveCount(4);
    await expect(page.locator('#group1 .pv-ones .blk')).toHaveCount(7);
    await expect(page.locator('#group1 .pv-tens .pv-label')).toContainText('4');
    // a single-digit second number goes in with ✅
    await type(page, '8');
    await expect(page.locator('#slot2')).toHaveText('8');
    expect((await state(page)).step).toBe('num2');
    await tapKey(page, 'enter');
    await waitForStep(page, 'answer');
    await type(page, '55');
    await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
    await expect(page.locator('#celebrateMsg')).toHaveText('Hooray! 🌟 47 + 8 = 55! You did it!');
  });

  test('level 9: Backspace edits a number being typed; 4-digit answers work', async ({ page }) => {
    await openApp(page);
    await setLevel(page, 9);
    await type(page, '24');
    await page.keyboard.press('Backspace');
    expect((await state(page)).entry).toBe('2');
    await type(page, '407');
    await waitForStep(page, 'num2');
    expect((await state(page)).num1).toBe(2407);
    await expect(page.locator('#group1 .pv-col')).toHaveCount(4);
    await expect(page.locator('#group1 .pv-hundreds .blk')).toHaveCount(4);
    await expect(page.locator('#group1 .pv-tens .blk')).toHaveCount(0); // a zero place is still shown
    await type(page, '586');
    await page.keyboard.press('Enter');
    await waitForStep(page, 'answer');
    await type(page, '2993');
    await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
  });

  test('a number cannot start with 0', async ({ page }) => {
    await openApp(page);
    await setLevel(page, 6);
    await tapKey(page, '0');
    expect((await state(page)).entry).toBe('');
    await expect(page.locator('#prompt')).toContainText('Numbers start at 1');
  });

  test('Take Away level 6: two groups with a − sign; cannot take away more than we have', async ({ page }) => {
    await openApp(page, 'subtraction');
    await setLevel(page, 6);
    await type(page, '45');
    await waitForStep(page, 'num2');
    await expect(page.locator('#group2')).toBeVisible();
    await expect(page.locator('#plusBig')).toHaveText('−');
    await type(page, '67');
    await expect(page.locator('#prompt')).toContainText('We only have 45');
    expect((await state(page)).num2).toBeNull();
    await type(page, '28');
    await waitForStep(page, 'answer');
    await type(page, '17');
    await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
    await expect(page.locator('#celebrateMsg')).toHaveText('Hooray! 🌟 45 − 28 = 17! You did it!');
  });

  test('"Show me the places" lights up the ones columns, then the tens', async ({ page }) => {
    await openApp(page);
    await setLevel(page, 6);
    await type(page, '35');
    await waitForStep(page, 'num2');
    await type(page, '48');
    await waitForStep(page, 'answer');
    await expect(page.locator('#countBtn')).toContainText('Show me the places');
    await page.locator('#countBtn').click({ force: true });
    await expect(page.locator('.pv-col.hint[data-place="ones"]')).toHaveCount(2, { timeout: 4000 });
    await expect(page.locator('.pv-col.hint[data-place="tens"]')).toHaveCount(2, { timeout: 5000 });
    await expect(page.locator('.pv-col.hint[data-place="ones"]')).toHaveCount(0);
  });

  for (const lv of [4, 8, 10]) {
    for (const mode of ['addition', 'subtraction']) {
      test(`Surprise me! at level ${lv} (${mode}) makes a solvable question`, async ({ page }) => {
        await openApp(page, mode);
        await setLevel(page, lv);
        await page.locator('#randomBtn').click({ force: true });
        await waitForStep(page, 'answer');
        const s = await state(page);
        const ans = mode === 'addition' ? s.num1 + s.num2 : s.num1 - s.num2;
        await type(page, String(ans));
        await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
      });
    }
  }

  for (const vp of [{ width: 360, height: 640 }, { width: 667, height: 375 }, { width: 1024, height: 768 }]) {
    test(`level 10 fits a ${vp.width}×${vp.height} screen`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto(APP_URL + '#subtraction');
      await page.waitForFunction(() => window.ToddlerMath && window.ToddlerMath.getState().screen === 'subtraction');
      await setLevel(page, 10);
      await type(page, '8204');
      await waitForStep(page, 'num2');
      await type(page, '3576');
      await waitForStep(page, 'answer');
      await page.waitForTimeout(1500);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      const eq = await page.locator('#equation').boundingBox();
      expect(eq.x).toBeGreaterThanOrEqual(0);
      expect(eq.x + eq.width).toBeLessThanOrEqual(vp.width);
      const inside = await page.locator('.blk').evaluateAll((bs) => bs.every((b) => {
        const r = b.getBoundingClientRect(), g = b.closest('.group').getBoundingClientRect();
        return r.left >= g.left - 1 && r.right <= g.right + 1 && r.top >= g.top - 1 && r.bottom <= g.bottom + 1;
      }));
      expect(inside).toBe(true);
      await page.screenshot({ path: `test-results/screens/level10-${vp.width}x${vp.height}.png` });
    });
  }
});
