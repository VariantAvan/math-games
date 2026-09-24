// Stage 2 — pick the second number.
const { test } = require('@playwright/test');
const { openApp, state, tapKey, waitForStep, expect } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await openApp(page);
  await tapKey(page, '3');
  await waitForStep(page, 'num2');
});

test('shows "3 + ? =" with the + centred between the two groups', async ({ page }) => {
  await expect(page.locator('#slot1')).toHaveText('3');
  await expect(page.locator('#slot2')).toHaveText('?');
  await expect(page.locator('#slot2')).toHaveClass(/active/);
  await expect(page.locator('#slotAns')).toHaveText('');
  const [g1, plus, g2] = await Promise.all(['#group1', '#plusBig', '#group2'].map((s) => page.locator(s).boundingBox()));
  expect(plus.x).toBeGreaterThan(g1.x + g1.width - 1);
  expect(plus.x + plus.width).toBeLessThan(g2.x + 1);
  await expect(page.locator('#plusBig')).not.toHaveClass(/hidden/);
});

test('entering 2 shows two more animals and moves to step 3', async ({ page }) => {
  await tapKey(page, '2');
  await expect(page.locator('#group2 .animal')).toHaveCount(2);
  await expect(page.locator('#slot2')).toHaveText('2');
  await waitForStep(page, 'answer');
  await expect(page.locator('#prompt')).toHaveText('How many altogether? Count them and type the answer!');
  await expect(page.locator('#group1 .animal')).toHaveCount(3);
});

test('0 is allowed as the second number and shows "none"', async ({ page }) => {
  await tapKey(page, '0');
  await expect(page.locator('#group2 .zero')).toBeVisible();
  await expect(page.locator('#group2 .animal')).toHaveCount(0);
  await waitForStep(page, 'answer');
  expect((await state(page)).num2).toBe(0);
});

test('keyboard digit works on step 2', async ({ page }) => {
  await page.keyboard.press('9');
  await waitForStep(page, 'answer');
  expect((await state(page)).num2).toBe(9);
  await expect(page.locator('#group2 .animal')).toHaveCount(9);
});

test('Back on step 2 returns to step 1 and clears the first group', async ({ page }) => {
  await tapKey(page, 'back');
  const s = await state(page);
  expect(s.step).toBe('num1');
  expect(s.num1).toBeNull();
  await expect(page.locator('#group1 .animal')).toHaveCount(0);
});

test('both groups use the same animal', async ({ page }) => {
  await tapKey(page, '4');
  await waitForStep(page, 'answer');
  const faces = await page.locator('.animal .face').allTextContents();
  expect(new Set(faces).size).toBe(1);
});
