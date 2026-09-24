const path = require('path');
const { expect } = require('@playwright/test');

const APP_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

/** Open the app on the welcome screen. */
async function openWelcome(page) {
  await page.goto(APP_URL);
  await page.waitForFunction(() => window.ToddlerMath && window.ToddlerMath.getState().screen === 'welcome');
}

/** Open the app, pick the Addition activity and wait for step 1. */
async function openApp(page) {
  await openWelcome(page);
  await page.locator('.activity[data-activity="addition"]').click({ force: true });
  await page.waitForFunction(() => window.ToddlerMath.getState().screen === 'addition' && window.ToddlerMath.getState().step === 'num1');
}

const state = (page) => page.evaluate(() => window.ToddlerMath.getState());
const soundLog = (page) => page.evaluate(() => [...window.ToddlerMath.soundLog]);
const spoken = (page) => page.evaluate(() => [...window.ToddlerMath.spoken]);

/** Tap an on-screen numpad key: '0'-'9', 'back' or 'enter'. */
async function tapKey(page, key) {
  // force: the Check key gently 'breathes' (looping scale), which Playwright treats as never stable.
  await page.locator(`.key[data-key="${key}"]`).click({ force: true });
}

async function waitForStep(page, step) {
  await page.waitForFunction((s) => window.ToddlerMath.getState().step === s && !window.ToddlerMath.getState().busy, step);
}

/** Play steps 1 and 2 so the game is waiting for the answer. */
async function setUpSum(page, a, b) {
  await tapKey(page, String(a));
  await waitForStep(page, 'num2');
  await tapKey(page, String(b));
  await waitForStep(page, 'answer');
}

module.exports = { APP_URL, openWelcome, openApp, state, soundLog, spoken, tapKey, waitForStep, setUpSum, expect };
