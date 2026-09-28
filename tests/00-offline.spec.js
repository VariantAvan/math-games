// The build itself: one file, offline, no external assets, no errors, toddler-proofing.
const fs = require('fs');
const path = require('path');
const { test } = require('@playwright/test');
const { openStart, openApp, answerRight, waitNext, totalTries, expect } = require('./helpers');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('index.html has no external scripts, stylesheets, fonts, images or audio', () => {
  expect(html).not.toMatch(/<script[^>]+src=/i);
  expect(html).not.toMatch(/<link[^>]+rel=["']?stylesheet/i);
  expect(html).not.toMatch(/@import/i);
  expect(html).not.toMatch(/\.(mp3|wav|ogg|m4a|woff2?|ttf|otf|png|jpe?g|gif|webp)\b/i);
  const urls = html.match(/https?:\/\/[^\s"')]+/g) || [];
  expect(urls.filter((u) => !u.startsWith('http://www.w3.org/2000/svg'))).toEqual([]);
  expect(html).not.toMatch(/\bfetch\(|XMLHttpRequest|new Audio\(/);
});

test('works offline with zero network requests and no errors over 12 questions', async ({ page, context }) => {
  const requests = [];
  const errors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await context.setOffline(true);
  await openApp(page);
  for (let i = 0; i < 12; i++) {
    const n = await totalTries(page);
    await answerRight(page);
    await waitNext(page, n);
  }
  expect(requests.filter((u) => !u.startsWith('file:') && !u.startsWith('data:'))).toEqual([]);
  expect(errors).toEqual([]);
});

test('audio starts only after the ▶️ tap', async ({ page }) => {
  await openStart(page);
  expect(await page.evaluate(() => window.SkillMix.audioState())).toBe('none');
  await page.locator('#playBtn').click({ force: true });
  await page.waitForFunction(() => window.SkillMix.audioState() === 'running');
});

test('toddler-proofing: no text selection, no zoom, touch-action manipulation', async ({ page }) => {
  await openStart(page);
  const css = await page.evaluate(() => {
    const b = getComputedStyle(document.body);
    return { select: b.userSelect || b.webkitUserSelect, touch: b.touchAction, overscroll: getComputedStyle(document.documentElement).overscrollBehaviorY };
  });
  expect(css).toEqual({ select: 'none', touch: 'manipulation', overscroll: 'none' });
  expect(await page.getAttribute('meta[name=viewport]', 'content')).toContain('user-scalable=no');
});
