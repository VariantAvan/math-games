// Take Away (subtraction) — full game flow.
const { test } = require('@playwright/test');
const { openApp, state, soundLog, spoken, tapKey, waitForStep, setUpSum, expect } = require('./helpers');

test.beforeEach(async ({ page }) => { await openApp(page, 'subtraction'); });

test('starts with the Take Away prompt, a − sign and a single group', async ({ page }) => {
  await expect(page.locator('#prompt')).toContainText('Pick how many to start with!');
  await expect(page.locator('#opSign')).toHaveText('−');
  await expect(page.locator('#group2')).toBeHidden();
  await expect(page.locator('#plusBig')).toBeHidden();
  await expect(page.locator('#gameTitle')).toHaveText('Take Away!');
});

test('step 1 shows the starting animals, step 2 asks how many go away', async ({ page }) => {
  await tapKey(page, '7');
  await expect(page.locator('#group1 .animal')).toHaveCount(7);
  await waitForStep(page, 'num2');
  await expect(page.locator('#prompt')).toHaveText('How many go away? Pick a number to take away!');
});

test('taking away 3 of 7 crosses out the last 3 and asks how many are left', async ({ page }) => {
  await setUpSum(page, 7, 3);
  await expect(page.locator('#group1 .animal')).toHaveCount(7);
  await expect(page.locator('#group1 .animal.gone')).toHaveCount(3);
  const gone = await page.locator('#group1 .animal').evaluateAll((as) => as.map((a) => a.classList.contains('gone')));
  expect(gone).toEqual([false, false, false, false, true, true, true]);
  await expect(page.locator('#prompt')).toHaveText('How many are left? Count them and type the answer!');
  await expect(page.locator('#slot1')).toHaveText('7');
  await expect(page.locator('#opSign')).toHaveText('−');
  await expect(page.locator('#slot2')).toHaveText('3');
  await expect(page.locator('#slotAns')).toHaveText('?');
  expect(await soundLog(page)).toContain('bye');
});

test('cannot take away more than we have: digits above the start are dimmed and refused', async ({ page }) => {
  await tapKey(page, '4');
  await waitForStep(page, 'num2');
  await expect(page.locator('.key[data-key="5"]')).toHaveClass(/dim/);
  await expect(page.locator('.key[data-key="4"]')).not.toHaveClass(/dim/);
  await tapKey(page, '6');
  const s = await state(page);
  expect(s.step).toBe('num2');
  expect(s.num2).toBeNull();
  await expect(page.locator('#prompt')).toContainText('We only have 4');
});

test('correct answer celebrates with "Hooray! 🌟 7 − 3 = 4! You did it!"', async ({ page }) => {
  await setUpSum(page, 7, 3);
  await tapKey(page, '4');
  await page.waitForSelector('#celebrate:not([hidden])');
  await expect(page.locator('#celebrateMsg')).toHaveText('Hooray! 🌟 7 − 3 = 4! You did it!');
  expect(await spoken(page)).toContain('Hooray! 7 take away 3 equals 4! You did it!');
});

test('wrong answer (typing the starting number) gets the gentle oops', async ({ page }) => {
  await setUpSum(page, 5, 2);
  await tapKey(page, '5');
  await expect(page.locator('#prompt')).toContainText('Oops, try counting them again!');
  await page.waitForFunction(() => window.ToddlerMath.getState().input === '' && !window.ToddlerMath.getState().busy);
  expect((await state(page)).step).toBe('answer');
  await expect(page.locator('#group1 .animal.gone')).toHaveCount(2);
});

test('take away everything: 5 − 5 = 0', async ({ page }) => {
  await setUpSum(page, 5, 5);
  await tapKey(page, '0');
  await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
});

test('take away zero: nobody leaves, 6 − 0 = 6', async ({ page }) => {
  await setUpSum(page, 6, 0);
  await expect(page.locator('#group1 .animal.gone')).toHaveCount(0);
  await tapKey(page, '6');
  await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
});

test('tapping counts only the animals that are left', async ({ page }) => {
  await setUpSum(page, 5, 2);
  const animals = page.locator('#group1 .animal');
  await animals.nth(4).click(); // gone
  expect((await state(page)).counted).toBe(0);
  for (let i = 0; i < 3; i++) await animals.nth(i).click();
  expect((await state(page)).counted).toBe(3);
  await expect(page.locator('#prompt')).toContainText('You counted them all');
});

test('"Count with me!" skips the animals that went away', async ({ page }) => {
  await page.evaluate(() => { window.ToddlerMath.config.countAlongMs = 60; });
  await setUpSum(page, 6, 4);
  await page.locator('#countBtn').click({ force: true });
  await page.waitForFunction(() => window.ToddlerMath.getState().counted === 2);
  await page.waitForTimeout(300);
  expect((await state(page)).counted).toBe(2);
  await expect(page.locator('#group1 .animal.gone.counted')).toHaveCount(0);
});

test('Back from step 3 brings the animals back', async ({ page }) => {
  await setUpSum(page, 6, 2);
  await page.keyboard.press('Backspace');
  expect((await state(page)).step).toBe('num2');
  await expect(page.locator('#group1 .animal.gone')).toHaveCount(0);
});

test('every question from 1−0 to 9−9 is accepted', async ({ page }) => {
  test.setTimeout(90_000);
  await page.evaluate(() => Object.assign(window.ToddlerMath.config, { appearStepMs: 1, settleMs: 5, checkDelayMs: 5, overlayDelayMs: 5, autoResetMs: 0 }));
  for (let a = 1; a <= 9; a++) {
    for (const b of [...new Set([0, Math.floor(a / 2), a])]) {
      await page.evaluate(() => window.ToddlerMath.reset());
      await setUpSum(page, a, b);
      await page.keyboard.press(String(a - b));
      await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
    }
  }
});
