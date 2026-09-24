// Welcome screen — choosing an activity, Home button, hash routing.
const { test } = require('@playwright/test');
const { APP_URL, openWelcome, openApp, state, spoken, tapKey, setUpSum, expect } = require('./helpers');

test('opens on the welcome screen with activity cards, game hidden', async ({ page }) => {
  await openWelcome(page);
  await expect(page.locator('#welcome')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  await expect(page.locator('.welcome-title')).toHaveText('Let’s play math!');
  await expect(page.locator('.activity')).toHaveCount(3);
  await expect(page.locator('.activity[data-activity="addition"]')).toContainText('Add Along');
  await expect(page.locator('.activity[data-activity="subtraction"]')).toContainText('Take Away');
  await expect(page.locator('.activity[data-activity="counting"]')).toContainText('Count Quickly');
  await expect(page.locator('.activity.play')).toHaveCount(3);
  await expect(page.locator('.activity.soon')).toHaveCount(0);
});

test('activity cards are big touch targets', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openWelcome(page);
  for (const box of await page.locator('.activity').evaluateAll((as) => as.map((a) => a.getBoundingClientRect().toJSON()))) {
    expect(box.width).toBeGreaterThanOrEqual(150);
    expect(box.height).toBeGreaterThanOrEqual(140);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test('tapping Add Along starts the addition game at step 1', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#welcome')).toBeHidden();
  await expect(page.locator('#app')).toBeVisible();
  expect(page.url()).toMatch(/#addition$/);
  expect(await spoken(page)).toContain('Pick the first number!');
});

test('Enter on the welcome screen starts Add Along', async ({ page }) => {
  await openWelcome(page);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.ToddlerMath.getState().screen === 'addition');
});

test('digit keys do nothing on the welcome screen', async ({ page }) => {
  await openWelcome(page);
  await page.keyboard.press('3');
  expect(await state(page)).toMatchObject({ screen: 'welcome', num1: null });
});

test('Home button mid-round returns to the welcome screen and clears the round', async ({ page }) => {
  await openApp(page);
  await setUpSum(page, 2, 2);
  await page.locator('#homeBtn').click();
  await page.waitForFunction(() => window.ToddlerMath.getState().screen === 'welcome');
  await expect(page.locator('#app')).toBeHidden();
  expect(await state(page)).toMatchObject({ step: 'num1', num1: null, num2: null });
});

test('browser Back from the game returns to the welcome screen', async ({ page }) => {
  await openApp(page);
  await tapKey(page, '4');
  await page.goBack();
  await page.waitForFunction(() => window.ToddlerMath.getState().screen === 'welcome');
  await expect(page.locator('#welcome')).toBeVisible();
});

test('opening …#addition directly skips the welcome screen', async ({ page }) => {
  await page.goto(APP_URL + '#addition');
  await page.waitForFunction(() => window.ToddlerMath && window.ToddlerMath.getState().screen === 'addition');
  await expect(page.locator('#welcome')).toBeHidden();
});

test('Home from Add Along, then Take Away switches the game', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#gameTitle')).toHaveText('Add Along!');
  await page.locator('#homeBtn').click();
  await page.locator('.activity[data-activity="subtraction"]').click({ force: true });
  await page.waitForFunction(() => window.ToddlerMath.getState().mode === 'subtraction');
  await expect(page.locator('#gameTitle')).toHaveText('Take Away!');
  expect(page.url()).toMatch(/#subtraction$/);
});
