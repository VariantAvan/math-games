// Stage 0 — the build itself: single file, offline, no external assets, no errors.
const fs = require('fs');
const path = require('path');
const { test } = require('@playwright/test');
const { APP_URL, openApp, setUpSum, tapKey, expect } = require('./helpers');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('index.html has no external scripts, stylesheets, fonts, images or audio', () => {
  expect(html).not.toMatch(/<script[^>]+src=/i);
  expect(html).not.toMatch(/<link[^>]+rel=["']?stylesheet/i);
  expect(html).not.toMatch(/@import/i);
  expect(html).not.toMatch(/\.(mp3|wav|ogg|m4a|woff2?|ttf|otf|png|jpe?g|gif|webp)\b/i);
  // Only the SVG namespace string inside the inline data: favicon may mention http.
  const urls = html.match(/https?:\/\/[^\s"')]+/g) || [];
  expect(urls.filter((u) => !u.startsWith('http://www.w3.org/2000/svg'))).toEqual([]);
  expect(html).not.toMatch(/\bfetch\(|XMLHttpRequest|new Audio\(/);
});

test('page makes zero network requests and works with the network offline', async ({ page, context }) => {
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  await context.setOffline(true);
  await openApp(page);
  await setUpSum(page, 2, 1);
  await tapKey(page, '3');
  await page.waitForFunction(() => window.ToddlerMath.getState().step === 'celebrate');
  const external = requests.filter((u) => !u.startsWith('file:') && !u.startsWith('data:'));
  expect(external).toEqual([]);
});

test('no console errors or uncaught exceptions during a full round', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await openApp(page);
  await setUpSum(page, 4, 4);
  await tapKey(page, '7'); // wrong
  await page.waitForFunction(() => !window.ToddlerMath.getState().busy && window.ToddlerMath.getState().input === '');
  await tapKey(page, '8'); // right
  await page.waitForSelector('#celebrate:not([hidden])');
  await page.locator('#againBtn').click({ force: true });
  expect(errors).toEqual([]);
});

test('audio context is created and running after the first interaction', async ({ page }) => {
  await openApp(page);
  expect(await page.evaluate(() => window.ToddlerMath.audioState())).toBe('none');
  await tapKey(page, '2');
  await page.waitForFunction(() => window.ToddlerMath.audioState() === 'running');
});

test('toddler-proofing: no text selection, no zoom, touch-action manipulation', async ({ page }) => {
  await openApp(page);
  const css = await page.evaluate(() => {
    const b = getComputedStyle(document.body);
    return { select: b.userSelect || b.webkitUserSelect, touch: b.touchAction, overscroll: getComputedStyle(document.documentElement).overscrollBehaviorY };
  });
  expect(css.select).toBe('none');
  expect(css.touch).toBe('manipulation');
  expect(css.overscroll).toBe('none');
  const viewport = await page.getAttribute('meta[name=viewport]', 'content');
  expect(viewport).toContain('user-scalable=no');
});

test('app URL is a local file', () => {
  expect(APP_URL.startsWith('file://')).toBe(true);
});
