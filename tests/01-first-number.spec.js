// Stage 1 — pick the first number.
const { test } = require('@playwright/test');
const { openApp, state, soundLog, spoken, tapKey, waitForStep, expect } = require('./helpers');

test.beforeEach(async ({ page }) => { await openApp(page); });

test('starts on step 1 with the right prompt and an active "?" slot', async ({ page }) => {
  await expect(page.locator('#prompt')).toContainText('Pick the first number!');
  await expect(page.locator('#slot1')).toHaveText('?');
  await expect(page.locator('#slot1')).toHaveClass(/active/);
  await expect(page.locator('#group1 .animal')).toHaveCount(0);
  await expect(page.locator('.steps li[data-s="num1"]')).toHaveClass(/on/);
  await expect(page.locator('#countBtn')).toHaveClass(/dim/); // counting helper only works on step 3
});

for (const n of [1, 5, 9]) {
  test(`tapping ${n} shows the numeral and exactly ${n} animals`, async ({ page }) => {
    await tapKey(page, String(n));
    await expect(page.locator('#slot1')).toHaveText(String(n));
    await expect(page.locator('#group1 .animal')).toHaveCount(n);
    await expect(page.locator('#group1 .gnum')).toHaveText(String(n));
    expect((await state(page)).num1).toBe(n);
  });
}

test('physical keyboard digits work too', async ({ page }) => {
  await page.keyboard.press('6');
  await expect(page.locator('#group1 .animal')).toHaveCount(6);
  expect((await state(page)).num1).toBe(6);
});

test('automatically moves to step 2 with a chime', async ({ page }) => {
  await tapKey(page, '3');
  await waitForStep(page, 'num2');
  await expect(page.locator('#prompt')).toHaveText('Now pick another number to add!');
  const log = await soundLog(page);
  expect(log).toContain('key');
  expect(log).toContain('pop');
  expect(log).toContain('chime');
  expect((await spoken(page)).some((t) => t.startsWith('3 '))).toBe(true);
});

test('0 is not accepted as the first number (gentle hint instead)', async ({ page }) => {
  await tapKey(page, '0');
  const s = await state(page);
  expect(s.step).toBe('num1');
  expect(s.num1).toBeNull();
  await expect(page.locator('#prompt')).toContainText('1 to 9');
});

test('extra taps during the transition are ignored', async ({ page }) => {
  await tapKey(page, '2');
  await tapKey(page, '7');
  await page.keyboard.press('8');
  await waitForStep(page, 'num2');
  const s = await state(page);
  expect(s.num1).toBe(2);
  expect(s.num2).toBeNull();
  await expect(page.locator('#group1 .animal')).toHaveCount(2);
});

test('held-down keys (auto-repeat) do not flood input', async ({ page }) => {
  await page.keyboard.down('4');
  await page.keyboard.down('4'); // Playwright marks this as repeat
  await page.keyboard.up('4');
  expect((await state(page)).num1).toBe(4);
});

test('animals are tappable (pop) on step 1', async ({ page }) => {
  await tapKey(page, '3');
  await page.locator('#group1 .animal').first().click();
  await expect(page.locator('#group1 .animal .face').first()).toHaveClass(/pop/);
});
