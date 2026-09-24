// Count Quickly — count the scattered things before the timer bar runs out.
const { test } = require('@playwright/test');
const { APP_URL, openWelcome, soundLog, expect } = require('./helpers');

const cstate = (page) => page.evaluate(() => window.ToddlerMath.count.state());
const ready = (page) => page.waitForFunction(() => {
  const s = window.ToddlerMath.count.state();
  return s.running && !s.busy;
});

async function openCount(page) {
  await openWelcome(page);
  await page.locator('.activity[data-activity="counting"]').click({ force: true });
  await page.waitForFunction(() => window.ToddlerMath.getState().screen === 'counting');
  await ready(page);
}

async function answerRight(page) {
  const { n } = await cstate(page);
  await page.keyboard.press(String(n));
  return n;
}

async function answerWrong(page) {
  const { n } = await cstate(page);
  await page.keyboard.press(String(n === 9 ? 1 : n + 1));
  return n;
}

test('welcome card opens the game: 1–9 things, a "?" box and a 10 s timer', async ({ page }) => {
  await openCount(page);
  expect(page.url()).toMatch(/#counting$/);
  await expect(page.locator('#countApp')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  const s = await cstate(page);
  expect(s.n).toBeGreaterThanOrEqual(1);
  expect(s.n).toBeLessThanOrEqual(9);
  expect(s.timerMs).toBe(10000);
  await expect(page.locator('.citem')).toHaveCount(s.n);
  await expect(page.locator('#cSlot')).toHaveText('?');
  await expect(page.locator('#cTime')).toHaveText('⏱ 10s');
  await expect(page.locator('#cScore')).toHaveText('⭐ 0');
});

test('the timer is a thin bar in the bottom 5% of the screen that counts down', async ({ page }) => {
  await openCount(page);
  const vh = page.viewportSize().height;
  const box = await page.locator('#cTimer').boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(vh * 0.95);
  expect(box.height).toBeLessThanOrEqual(vh * 0.05);
  const w1 = (await page.locator('#cTimerBar').boundingBox()).width;
  await page.waitForTimeout(600);
  const w2 = (await page.locator('#cTimerBar').boundingBox()).width;
  expect(w2).toBeLessThan(w1);
});

test('things are scattered inside the play area without overlapping', async ({ page }) => {
  await openCount(page);
  await page.waitForTimeout(600);
  const { inside, overlaps } = await page.evaluate(() => {
    const f = document.getElementById('cField').getBoundingClientRect();
    const rs = [...document.querySelectorAll('.citem')].map((e) => e.getBoundingClientRect());
    const inside = rs.every((r) => r.left >= f.left && r.right <= f.right && r.top >= f.top && r.bottom <= f.bottom);
    let overlaps = 0;
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > a.width * 0.35 && oy > a.height * 0.35) overlaps++;
    }
    return { inside, overlaps };
  });
  expect(inside).toBe(true);
  expect(overlaps).toBe(0);
});

test('right answer: applause, score +1, timer 0.5 s shorter, new number', async ({ page }) => {
  await openCount(page);
  const n = await answerRight(page);
  await expect(page.locator('#cSlot')).toHaveClass(/right/);
  expect(await soundLog(page)).toContain('applause');
  let s = await cstate(page);
  expect(s.score).toBe(1);
  expect(s.timerMs).toBe(9500);
  await ready(page);
  s = await cstate(page);
  expect(s.n).not.toBe(n);
  await expect(page.locator('.citem')).toHaveCount(s.n);
  await expect(page.locator('#cTime')).toHaveText('⏱ 9.5s');
  await expect(page.locator('#cSlot')).toHaveText('?');
});

test('on-screen keypad works too', async ({ page }) => {
  await openCount(page);
  const { n } = await cstate(page);
  await page.locator(`#cPad .key[data-key="${n}"]`).click({ force: true });
  expect((await cstate(page)).score).toBe(1);
});

test('wrong answer: sad sound, same number, timer 0.5 s longer (never above 10 s)', async ({ page }) => {
  await openCount(page);
  await answerRight(page);
  await ready(page);
  await answerRight(page);
  await ready(page);
  expect((await cstate(page)).timerMs).toBe(9000);
  const n = await answerWrong(page);
  await expect(page.locator('#cSlot')).toHaveClass(/wrong/);
  expect(await soundLog(page)).toContain('sad');
  await ready(page);
  let s = await cstate(page);
  expect(s.n).toBe(n);
  expect(s.timerMs).toBe(9500);
  expect(s.score).toBe(2);
  await expect(page.locator('.citem')).toHaveCount(n);
  // the countdown restarted from full
  expect(s.left).toBeGreaterThan(8500);
  await answerWrong(page);
  await ready(page);
  await answerWrong(page);
  await ready(page);
  expect((await cstate(page)).timerMs).toBe(10000); // capped
});

test('time running out counts as a miss: sad sound, same number, +0.5 s, timer restarts', async ({ page }) => {
  await openCount(page);
  await page.evaluate(() => window.ToddlerMath.count.setTimer(800));
  const { n } = await cstate(page);
  await expect(page.locator('#cPrompt')).toHaveText("Time's up! Try again!", { timeout: 3000 });
  expect(await soundLog(page)).toContain('sad');
  await ready(page);
  const s = await cstate(page);
  expect(s.n).toBe(n);
  expect(s.timerMs).toBe(1300);
});

test('timer shrinks to a minimum of 0.5 s', async ({ page }) => {
  await openCount(page);
  await page.evaluate(() => window.ToddlerMath.count.setTimer(1000));
  await answerRight(page);
  expect((await cstate(page)).timerMs).toBe(500);
  await ready(page);
  await answerRight(page);
  expect((await cstate(page)).timerMs).toBe(500);
});

test('keys pressed during the pause after an answer are ignored', async ({ page }) => {
  await openCount(page);
  await answerRight(page);
  await page.keyboard.press('1');
  await page.keyboard.press('2');
  const s = await cstate(page);
  expect(s.score).toBe(1);
  expect(s.timerMs).toBe(9500);
});

test('never the same number twice in a row', async ({ page }) => {
  await openCount(page);
  let prev = (await cstate(page)).n;
  for (let i = 0; i < 6; i++) {
    await answerRight(page);
    await ready(page);
    const { n } = await cstate(page);
    expect(n).not.toBe(prev);
    prev = n;
  }
});

test('Home stops the clock: no time-up after leaving', async ({ page }) => {
  await openCount(page);
  await page.evaluate(() => window.ToddlerMath.count.setTimer(500));
  await page.locator('#cHomeBtn').click();
  await page.waitForFunction(() => window.ToddlerMath.getState().screen === 'welcome');
  await page.evaluate(() => { window.ToddlerMath.soundLog.length = 0; });
  await page.waitForTimeout(1200);
  expect(await soundLog(page)).not.toContain('sad');
  await expect(page.locator('#countApp')).toBeHidden();
});

test('the animal picker pauses the clock and swaps the animal', async ({ page }) => {
  await openCount(page);
  await page.evaluate(() => window.ToddlerMath.count.setTimer(1500));
  await page.locator('#cThemeBtn').click();
  await page.locator('.theme-opt[data-theme="frog"]').click();
  await page.waitForTimeout(2000); // longer than the timer: it must be paused
  expect((await cstate(page)).timerMs).toBe(1500);
  await page.locator('#closeTheme').click();
  await expect(page.locator('.citem').first()).toHaveText('🐸');
  expect((await cstate(page)).running).toBe(true);
});

for (const vp of [{ width: 360, height: 640 }, { width: 667, height: 375 }, { width: 1024, height: 768 }]) {
  test(`fits a ${vp.width}×${vp.height} screen with 64 px keys`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto(APP_URL + '#counting');
    await page.waitForFunction(() => window.ToddlerMath && window.ToddlerMath.getState().screen === 'counting');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const keys = await page.locator('#cPad .key').evaluateAll((ks) => ks.map((k) => k.getBoundingClientRect().toJSON()));
    expect(keys).toHaveLength(9);
    for (const r of keys) {
      expect(r.width).toBeGreaterThanOrEqual(64);
      expect(r.height).toBeGreaterThanOrEqual(64);
      expect(r.bottom).toBeLessThanOrEqual(vp.height);
    }
    const field = await page.locator('#cField').boundingBox();
    expect(field.height).toBeGreaterThanOrEqual(120);
    await page.screenshot({ path: `test-results/screens/count-${vp.width}x${vp.height}.png` });
  });
}
