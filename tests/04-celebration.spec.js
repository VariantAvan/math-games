// Stage 4 — celebration and replay.
const { test } = require('@playwright/test');
const { openApp, state, soundLog, spoken, tapKey, setUpSum, expect } = require('./helpers');

async function winRound(page, a = 3, b = 2) {
  await setUpSum(page, a, b);
  for (const ch of String(a + b)) await tapKey(page, ch);
  await page.waitForSelector('#celebrate:not([hidden])');
}

test.beforeEach(async ({ page }) => { await openApp(page); });

test('shows "Hooray! 🌟 3 + 2 = 5! You did it!" and a Play Again button', async ({ page }) => {
  await winRound(page);
  await expect(page.locator('#celebrateMsg')).toHaveText('Hooray! 🌟 3 + 2 = 5! You did it!');
  await expect(page.locator('#againBtn')).toBeVisible();
  expect(await spoken(page)).toContain('Hooray! 3 plus 2 equals 5! You did it!');
});

test('fanfare, applause and firework booms are synthesized', async ({ page }) => {
  await winRound(page);
  await page.waitForFunction(() => window.ToddlerMath.soundLog.includes('boom'));
  const log = await soundLog(page);
  expect(log).toEqual(expect.arrayContaining(['fanfare', 'applause', 'whistle', 'boom']));
});

test('canvas particles are drawn, then fade away completely', async ({ page }) => {
  test.setTimeout(30_000);
  await page.evaluate(() => { window.ToddlerMath.config.autoResetMs = 0; });
  await winRound(page);
  expect(await page.evaluate(() => window.ToddlerMath.particles())).toBeGreaterThan(50);
  const painted = await page.evaluate(() => {
    const c = document.getElementById('fx');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });
  expect(painted).toBeGreaterThan(100);
  await page.waitForFunction(() => window.ToddlerMath.particles() === 0, null, { timeout: 20_000 });
});

test('Play Again resets to a fresh step 1', async ({ page }) => {
  await winRound(page);
  await page.locator('#againBtn').click({ force: true });
  const s = await state(page);
  expect(s).toMatchObject({ step: 'num1', num1: null, num2: null, input: '', wrongs: 0 });
  await expect(page.locator('#celebrate')).toBeHidden();
  await expect(page.locator('.animal')).toHaveCount(0);
  expect(await page.evaluate(() => window.ToddlerMath.particles())).toBe(0);
});

test('Enter key plays again from the celebration screen', async ({ page }) => {
  await winRound(page);
  await page.keyboard.press('Enter');
  expect((await state(page)).step).toBe('num1');
});

test('digits are ignored while celebrating', async ({ page }) => {
  await winRound(page);
  await page.keyboard.press('4');
  expect((await state(page)).step).toBe('celebrate');
});

test('auto-resets after the configured delay', async ({ page }) => {
  await page.evaluate(() => { window.ToddlerMath.config.autoResetMs = 1200; });
  await winRound(page);
  await page.waitForFunction(() => window.ToddlerMath.getState().step === 'num1', null, { timeout: 5000 });
});
