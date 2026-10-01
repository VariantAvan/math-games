// The grown-ups sheet: press and hold ⚙️, switch skills on/off, try a skill, sound, stats.
const { test } = require('@playwright/test');
const { APP_URL, openApp, state, soundLog, force, answerRight, waitNext, totalTries, waitReady, expect } = require('./helpers');

async function holdGear(page, ms = 1100) {
  const box = await page.locator('#parentBtn').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

test('a quick tap on ⚙️ does nothing; press and hold opens the grown-ups sheet', async ({ page }) => {
  await openApp(page);
  await holdGear(page, 150);
  await expect(page.locator('#parentSheet')).toBeHidden();
  await holdGear(page);
  await expect(page.locator('#parentSheet')).toBeVisible();
  await expect(page.locator('.skill-row')).toHaveCount(10);
  await page.keyboard.press('Escape');
  await expect(page.locator('#parentSheet')).toBeHidden();
});

test('switching skills off: only the skills left on are asked', async ({ page }) => {
  await openApp(page);
  await holdGear(page);
  for (const id of ['numbers', 'counting', 'addition', 'jumble', 'compare']) {
    await page.locator(`[data-toggle="${id}"]`).click();
  }
  expect(await page.evaluate(() => window.SkillMix.enabled())).toEqual(['pattern', 'shapes']);
  await page.locator('#closeParent').click();
  const seen = [];
  for (let i = 0; i < 6; i++) {
    const n = await totalTries(page);
    const st = await answerRight(page);
    await waitNext(page, n);
    seen.push((await state(page)).skill);
  }
  expect(seen.every((s) => ['pattern', 'shapes'].includes(s))).toBe(true);
  // remembered on this device
  await page.goto(APP_URL);
  await page.waitForFunction(() => window.SkillMix);
  expect(await page.evaluate(() => window.SkillMix.enabled())).toEqual(['pattern', 'shapes']);
});

test('the last skill that is on cannot be switched off', async ({ page }) => {
  await openApp(page);
  await holdGear(page);
  const ids = await page.evaluate(() => window.SkillMix.skills.filter((s) => !window.SkillMix.paused.includes(s)));
  for (const id of ids) await page.locator(`[data-toggle="${id}"]`).click();
  expect(await page.evaluate(() => window.SkillMix.enabled())).toEqual(['shapes']);
  await expect(page.locator('[data-toggle="shapes"]')).toHaveText('On');
});

test('"Try now" jumps straight to that skill', async ({ page }) => {
  await openApp(page);
  await holdGear(page);
  await page.locator('[data-try="starts"]').click();
  await expect(page.locator('#parentSheet')).toBeHidden();
  await waitReady(page, 'starts');
});

test('sound off silences sounds and the voice, and is remembered', async ({ page }) => {
  await openApp(page);
  await holdGear(page);
  await page.locator('#soundToggle').click();
  await expect(page.locator('#soundToggle')).toHaveText('Off');
  await page.locator('#closeParent').click();
  await page.evaluate(() => { window.SkillMix.soundLog.length = 0; });
  await answerRight(page);
  await page.waitForTimeout(300);
  expect(await soundLog(page)).toEqual([]);
  await page.goto(APP_URL);
  await page.waitForFunction(() => window.SkillMix);
  await page.locator('#playBtn').click({ force: true });
  await page.waitForTimeout(400);
  expect(await soundLog(page)).toEqual([]);
});

test('the sheet shows tries, right answers, first tries and average time per skill', async ({ page }) => {
  await openApp(page);
  await force(page, 'shapes');
  await answerRight(page);
  await page.waitForFunction(() => window.SkillMix.stats().shapes.correct === 1);
  await page.waitForFunction(() => window.SkillMix.state().ready && Object.values(window.SkillMix.stats()).reduce((t, s) => t + s.tries, 0) >= 2);
  await holdGear(page);
  await expect(page.locator('.skill-row[data-skill="shapes"]')).toContainText('level 1');
  await expect(page.locator('.skill-row[data-skill="shapes"] .stat')).toContainText('1 right · 1 first try · 0 wrong taps');
  await expect(page.locator('.skill-row[data-skill="shapes"] .stat')).toContainText(/\d+\.\d s each/);
});

test('the sheet can be opened from the start screen too', async ({ page }) => {
  await page.goto(APP_URL);
  const box = await page.locator('#startParentBtn').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1100);
  await page.mouse.up();
  await expect(page.locator('#parentSheet')).toBeVisible();
});

test('paused games show "Paused", are never asked, but "Try now" still works', async ({ page }) => {
  await openApp(page);
  expect(await page.evaluate(() => window.SkillMix.paused)).toEqual(['letters', 'starts', 'subtraction']);
  expect(await page.evaluate(() => window.SkillMix.enabled())).not.toContain('subtraction');
  await holdGear(page);
  await expect(page.locator('.skill-row[data-skill="subtraction"] .pill.paused')).toHaveText('Paused');
  await expect(page.locator('[data-toggle="subtraction"]')).toHaveCount(0);
  await page.locator('[data-try="subtraction"]').click();
  await waitReady(page, 'subtraction');
});

test('session length can be set (5, 8, 10, 15 min or no limit) and is remembered', async ({ page }) => {
  await openApp(page);
  expect(await page.evaluate(() => window.SkillMix.sessionMin())).toBe(5);
  await holdGear(page);
  await expect(page.locator('#sessionPills .pill')).toHaveText(['5 min', '8 min', '10 min', '15 min', 'No limit']);
  await page.locator('#sessionPills [data-min="10"]').click();
  await expect(page.locator('#sessionPills [data-min="10"]')).toHaveClass(/on/);
  await page.goto(APP_URL);
  await page.waitForFunction(() => window.SkillMix);
  expect(await page.evaluate(() => window.SkillMix.sessionMin())).toBe(10);
});

test('grown-up tips during demos can be switched off', async ({ page }) => {
  await openApp(page);
  await holdGear(page);
  await page.locator('#tipsToggle').click();
  await expect(page.locator('#tipsToggle')).toHaveText('Off');
  await page.locator('#closeParent').click();
  await page.evaluate(() => { Object.assign(window.SkillMix.config, { demoStepMs: 400 }); window.SkillMix.force('shapes'); });
  await page.waitForFunction(() => window.SkillMix.state().inDemo);
  await page.waitForTimeout(300);
  await expect(page.locator('#caption')).toBeHidden();
});

test('"Test voice" speaks and shows what the voice of the device is doing', async ({ page }) => {
  await openApp(page);
  await holdGear(page);
  await expect(page.locator('#voiceStatus')).not.toBeEmpty();
  await page.locator('#voiceTest').click();
  await expect(page.locator('#voiceStatus')).toContainText(/voice|Speaking/, { timeout: 3000 });
  await page.waitForTimeout(1700);
  await expect(page.locator('#voiceStatus')).toContainText(/spoken so far|no built-in voice/);
});

test('the sheet shows which side he tends to tap and his last mix-up', async ({ page }) => {
  await openApp(page);
  await force(page, 'shapes');
  const st = await state(page);
  for (let i = 0; i < 6; i++) await page.locator(`#answers .card[data-i="${1 - st.q.answer}"]`).click({ force: true });
  await holdGear(page);
  await expect(page.locator('.skill-row[data-skill="shapes"] .stat')).toContainText(/picks left (0|100)%/);
  await expect(page.locator('.skill-row[data-skill="shapes"] .stat')).toContainText(`last mix-up: picked ${st.q.labels[1 - st.q.answer]} for ${st.q.labels[st.q.answer]}`);
});
