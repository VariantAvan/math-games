// Stage 3 — count and solve.
const { test } = require('@playwright/test');
const { openApp, state, soundLog, tapKey, setUpSum, expect } = require('./helpers');

test.beforeEach(async ({ page }) => { await openApp(page); });

test('shows the counting helper and a "?" answer slot', async ({ page }) => {
  await setUpSum(page, 3, 2);
  await expect(page.locator('#slotAns')).toHaveText('?');
  await expect(page.locator('#countBtn')).toBeVisible();
  await expect(page.locator('.steps li[data-s="answer"]')).toHaveClass(/on/);
});

test('tapping animals numbers them 1, 2, 3… and re-taps do not double count', async ({ page }) => {
  await setUpSum(page, 3, 2);
  const animals = page.locator('.animal');
  await animals.nth(0).click();
  await animals.nth(3).click();
  await animals.nth(0).click(); // already counted
  await expect(animals.nth(0).locator('.badge')).toHaveText('1');
  await expect(animals.nth(3).locator('.badge')).toHaveText('2');
  expect((await state(page)).counted).toBe(2);
  expect((await soundLog(page)).filter((s) => s === 'pop').length).toBeGreaterThan(2);
});

test('counting every animal gives an encouraging prompt without revealing the sum', async ({ page }) => {
  await setUpSum(page, 2, 1);
  for (let i = 0; i < 3; i++) await page.locator('.animal').nth(i).click();
  await expect(page.locator('#prompt')).toContainText('You counted them all');
  await expect(page.locator('#prompt')).not.toContainText('3');
});

test('correct single-digit answer auto-checks and celebrates', async ({ page }) => {
  await setUpSum(page, 3, 2);
  await tapKey(page, '5');
  await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
  await expect(page.locator('#slotAns')).toHaveText('5');
  await expect(page.locator('#slotAns')).toHaveClass(/right/);
});

test('wrong answer: gentle shake, "Oops" prompt, input cleared, animals stay', async ({ page }) => {
  await setUpSum(page, 3, 2);
  await tapKey(page, '4');
  await expect(page.locator('#equation')).toHaveClass(/shake/);
  await expect(page.locator('#prompt')).toContainText('Oops, try counting them again!');
  await expect(page.locator('#slotAns')).toHaveClass(/wrong/);
  await page.waitForFunction(() => window.ToddlerMath.getState().input === '' && !window.ToddlerMath.getState().busy);
  const s = await state(page);
  expect(s.step).toBe('answer');
  expect(s.wrongs).toBe(1);
  await expect(page.locator('#slotAns')).toHaveText('?');
  await expect(page.locator('.animal')).toHaveCount(5);
  expect(await soundLog(page)).toContain('boop');
});

test('wrong answer clears counting badges so the child can recount', async ({ page }) => {
  await setUpSum(page, 2, 2);
  await page.locator('.animal').nth(0).click();
  await tapKey(page, '3');
  await page.waitForFunction(() => window.ToddlerMath.getState().input === '' && !window.ToddlerMath.getState().busy);
  await expect(page.locator('.animal.counted')).toHaveCount(0);
});

test('two-digit answer: waits after the first digit, then celebrates (9 + 9 = 18)', async ({ page }) => {
  await setUpSum(page, 9, 9);
  await tapKey(page, '1');
  await page.waitForTimeout(700);
  expect((await state(page)).step).toBe('answer');
  await expect(page.locator('#slotAns')).toHaveText('1');
  await tapKey(page, '8');
  await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
});

test('Enter/Check checks a short answer early (7 + 5, typing 1 then Enter is wrong)', async ({ page }) => {
  await setUpSum(page, 7, 5);
  await tapKey(page, '1');
  await tapKey(page, 'enter');
  await expect(page.locator('#prompt')).toContainText('Oops');
});

test('Backspace edits the answer; empty Backspace goes back to step 2', async ({ page }) => {
  await setUpSum(page, 6, 6);
  await tapKey(page, '1');
  await page.keyboard.press('Backspace');
  expect((await state(page)).input).toBe('');
  await page.keyboard.press('Backspace');
  const s = await state(page);
  expect(s.step).toBe('num2');
  expect(s.num2).toBeNull();
});

test('full round with the physical keyboard only', async ({ page }) => {
  await page.keyboard.press('8');
  await page.waitForFunction(() => window.ToddlerMath.getState().step === 'num2' && !window.ToddlerMath.getState().busy);
  await page.keyboard.press('7');
  await page.waitForFunction(() => window.ToddlerMath.getState().step === 'answer' && !window.ToddlerMath.getState().busy);
  await page.keyboard.press('1');
  await page.keyboard.press('5');
  await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
});

test('"Count with me!" counts every animal in order', async ({ page }) => {
  await page.evaluate(() => { window.ToddlerMath.config.countAlongMs = 60; });
  await setUpSum(page, 2, 3);
  await page.locator('#countBtn').click({ force: true });
  await page.waitForFunction(() => window.ToddlerMath.getState().counted === 5);
  await expect(page.locator('.animal .badge')).toHaveText(['1', '2', '3', '4', '5']);
});

test('every sum from 1+0 to 9+9 is accepted', async ({ page }) => {
  test.setTimeout(60_000);
  await page.evaluate(() => Object.assign(window.ToddlerMath.config, { appearStepMs: 1, settleMs: 5, checkDelayMs: 5, overlayDelayMs: 5, autoResetMs: 0 }));
  for (let a = 1; a <= 9; a++) {
    for (const b of [0, 9 - a, 9]) {
      await page.evaluate(() => window.ToddlerMath.reset());
      await setUpSum(page, a, b);
      for (const ch of String(a + b)) await page.keyboard.press(ch);
      await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
    }
  }
});
