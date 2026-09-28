// The question engine: start screen, intros, random skills, answers, stickers, hints, stats.
const { test } = require('@playwright/test');
const { APP_URL, openStart, openApp, state, spoken, soundLog, waitReady, force, answerRight, answerWrong, waitNext, totalTries, expect } = require('./helpers');

test('start screen: a big ▶️ and the 10 skill mascots, nothing asked yet', async ({ page }) => {
  await openStart(page);
  await expect(page.locator('#playBtn')).toBeVisible();
  await expect(page.locator('#parade span')).toHaveCount(10);
  expect((await state(page)).started).toBe(false);
  expect(await spoken(page)).toEqual([]);
});

test('Enter or Space on the start screen starts too', async ({ page }) => {
  await openStart(page);
  await page.keyboard.press('Enter');
  await waitReady(page);
});

test('each question opens with the skill mascot + icon + jingle, then is spoken', async ({ page }) => {
  await openStart(page, { introMs: 800 });
  await page.locator('#playBtn').click({ force: true });
  await expect(page.locator('#intro')).toBeVisible();
  const mascot = await page.locator('#introMascot').textContent();
  expect(mascot.length).toBeGreaterThan(0);
  expect(await soundLog(page)).toContain('jingle');
  await waitReady(page);
  await expect(page.locator('#intro')).toBeHidden();
  await expect(page.locator('#prompt .mascot')).toHaveText(mascot);
  const st = await state(page);
  expect(await spoken(page)).toContain(st.q.say);
});

test('tapping the intro skips it', async ({ page }) => {
  await openStart(page, { introMs: 20000 });
  await page.locator('#playBtn').click({ force: true });
  await expect(page.locator('#intro')).toBeVisible();
  await page.locator('#intro').click({ force: true });
  await waitReady(page);
});

test('skills are random and never the same twice in a row', async ({ page }) => {
  await openApp(page);
  const seen = [];
  for (let i = 0; i < 25; i++) {
    const n = await totalTries(page);
    const st = await answerRight(page);
    seen.push(st.skill);
    await waitNext(page, n);
  }
  for (let i = 1; i < seen.length; i++) expect(seen[i], `question ${i}`).not.toBe(seen[i - 1]);
  expect(new Set(seen).size).toBeGreaterThanOrEqual(6);
});

test('right answer: green card, praise, a sticker, stats recorded', async ({ page }) => {
  await openApp(page, { introMs: 60, rightPauseMs: 3000, wrongMs: 80, bigPartyMs: 300 });
  await force(page, 'numbers');
  const st = await answerRight(page);
  await expect(page.locator(`#answers .card[data-i="${st.q.answer}"]`)).toHaveClass(/right/);
  await expect(page.locator('.slot-sticker.on')).toHaveCount(1);
  expect(await spoken(page)).toContain(st.q.praise);
  expect(await soundLog(page)).toEqual(expect.arrayContaining(['chime', 'applause']));
  const s = (await page.evaluate(() => window.SkillMix.stats())).numbers;
  expect(s).toMatchObject({ level: 1, correct: 1, firstTry: 1 });
  expect(s.tries).toBeGreaterThanOrEqual(1);
  expect(s.totalMs).toBeGreaterThan(0);
});

test('wrong answer: wobble, "Try again!", the card fades and the right one glows', async ({ page }) => {
  await openApp(page);
  await force(page, 'letters');
  const st = await answerWrong(page);
  const wrongCard = page.locator(`#answers .card[data-i="${1 - st.q.answer}"]`);
  await expect(wrongCard).toHaveClass(/wrong/);
  expect(await soundLog(page)).toContain('boop');
  expect(await spoken(page)).toContain('Try again!');
  await expect(wrongCard).toHaveClass(/faded/);
  await expect(page.locator(`#answers .card[data-i="${st.q.answer}"]`)).toHaveClass(/glow/);
  // tapping the faded card does nothing
  await wrongCard.click({ force: true });
  expect((await state(page)).wrongs).toBe(1);
  await answerRight(page);
  await page.waitForFunction(() => window.SkillMix.stats().letters.correct === 1);
  expect((await page.evaluate(() => window.SkillMix.stats())).letters.firstTry).toBe(0);
});

test('five stickers: a big party (fireworks + fanfare), then the row starts again', async ({ page }) => {
  await openApp(page);
  for (let i = 0; i < 5; i++) {
    const n = await totalTries(page);
    await answerRight(page);
    if (i < 4) await waitNext(page, n);
  }
  await page.waitForFunction(() => window.SkillMix.soundLog.includes('fanfare'));
  expect(await page.evaluate(() => window.SkillMix.particles())).toBeGreaterThan(50);
  expect(await spoken(page)).toContain('Hooray! Five stickers! You are a superstar!');
  await page.waitForFunction(() => window.SkillMix.state().ready && window.SkillMix.state().stickers === 0);
  await expect(page.locator('.slot-sticker.on')).toHaveCount(0);
});

test('🔊 says the question again', async ({ page }) => {
  await openApp(page);
  const st = await state(page);
  await page.evaluate(() => { window.SkillMix.spoken.length = 0; });
  await page.locator('#replayBtn').click({ force: true });
  expect(await spoken(page)).toEqual([st.q.say]);
});

test('the first time a skill appears, the pointing hand demonstrates tapping', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#hand')).toBeVisible({ timeout: 3000 });
});

test('after a quiet spell the question is repeated and the hand shows what to do', async ({ page }) => {
  await openApp(page, { introMs: 60, rightPauseMs: 150, wrongMs: 80, bigPartyMs: 300, idleHintMs: 5000 });
  await page.waitForFunction(() => document.getElementById('hand').hidden, null, { timeout: 8000 });
  const st = await state(page);
  await page.evaluate(() => { window.SkillMix.spoken.length = 0; });
  await page.waitForFunction((say) => window.SkillMix.spoken.includes(say), st.q.say, { timeout: 7000 });
  await expect(page.locator('#hand')).toBeVisible();
});

test('number keys 1–4 pick the cards (keyboard)', async ({ page }) => {
  await openApp(page);
  await force(page, 'shapes');
  const st = await state(page);
  await page.keyboard.press(String(st.q.answer + 1));
  await page.waitForFunction(() => window.SkillMix.stats().shapes.correct === 1);
});

test('tapping animals in a question counts them 1, 2, 3', async ({ page }) => {
  await openApp(page);
  await force(page, 'counting');
  const n = (await state(page)).q.data.n;
  const critters = page.locator('#prompt .critter');
  await expect(critters).toHaveCount(n);
  for (let i = 0; i < n; i++) await critters.nth(i).click({ force: true });
  await expect(page.locator('#prompt .critter .badge')).toHaveText(Array.from({ length: n }, (_, i) => String(i + 1)));
  await critters.first().click({ force: true }); // already counted
  expect((await state(page)).counted).toBe(n);
});

test('stats are kept on the device across visits', async ({ page }) => {
  await openApp(page);
  await force(page, 'pattern');
  await answerRight(page);
  await page.waitForFunction(() => window.SkillMix.stats().pattern.correct === 1);
  await page.goto(APP_URL);
  await page.waitForFunction(() => window.SkillMix);
  expect((await page.evaluate(() => window.SkillMix.stats())).pattern.correct).toBe(1);
});
