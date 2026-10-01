// The question engine: start, blocks with intro + demo, answers, mistakes, stickers, hints, session length, touch.
const { test } = require('@playwright/test');
const { APP_URL, FAST, openStart, openApp, state, spoken, soundLog, waitReady, force, answerRight, answerWrong, waitNext, totalTries, expect } = require('./helpers');

test('start screen: a big ▶️ and the mascots of the games in play, nothing asked yet', async ({ page }) => {
  await openStart(page);
  await expect(page.locator('#playBtn')).toBeVisible();
  await expect(page.locator('#parade span')).toHaveCount(7); // 10 games, 3 paused
  expect((await state(page)).started).toBe(false);
  await expect(page.locator('#trophy')).toBeHidden();
});

test('Enter or Space on the start screen starts too', async ({ page }) => {
  await openStart(page);
  await page.keyboard.press('Enter');
  await waitReady(page);
});

test('a game opens with intro (mascot, icon, description, jingle), then a demo, then "Your turn!"', async ({ page }) => {
  await openStart(page, { ...FAST, introMs: 800, demoStepMs: 900, yourTurnMs: 600 });
  await page.locator('#playBtn').click({ force: true });
  await expect(page.locator('#intro')).toBeVisible();
  const mascot = await page.locator('#introMascot').textContent();
  const label = await page.locator('#introLabel').textContent();
  const words = label.split(/\s+/).filter(Boolean).length;
  expect(words).toBeGreaterThanOrEqual(2);
  expect(words).toBeLessThanOrEqual(3);
  expect(await soundLog(page)).toContain('jingle');
  // the demo: 👀, the hand, and a grown-up tip
  await page.waitForFunction(() => window.SkillMix.state().inDemo);
  await expect(page.locator('#watch')).toBeVisible();
  await expect(page.locator('#hand')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('#caption')).toContainText('Grown-ups:');
  await expect(page.locator('#yourTurn')).toBeVisible({ timeout: 8000 });
  await waitReady(page);
  await expect(page.locator('#watch')).toBeHidden();
  await expect(page.locator('#intro')).toBeHidden();
  await expect(page.locator('#prompt .tag .mascot')).toHaveText(mascot);
  await expect(page.locator('#prompt .tag .tag-text')).toHaveText(label);
  const st = await state(page);
  expect(await spoken(page)).toContain(st.q.say);
  // the demo didn't count as a try or a sticker
  expect(st.stickers).toBe(0);
});

test('the demo plays the game: the hand answers its example correctly', async ({ page }) => {
  await openApp(page, { ...FAST, demoStepMs: 250, yourTurnMs: 2000 });
  await page.evaluate(() => window.SkillMix.force('shapes'));
  await expect(page.locator('#yourTurn')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('#answers .card.right')).toHaveCount(1);
});

test('tapping the intro or the demo skips it', async ({ page }) => {
  await openStart(page, { ...FAST, introMs: 20000, demoStepMs: 20000 });
  await page.locator('#playBtn').click({ force: true });
  await page.locator('#intro').click({ force: true });
  await page.waitForFunction(() => window.SkillMix.state().inDemo);
  await page.locator('#answers .card, #answers .tile').first().click({ force: true });
  await waitReady(page);
});

test('games come in blocks of 3–4 questions, then switch to a different game; paused games never come up', async ({ page }) => {
  await openApp(page);
  const seen = [];
  for (let i = 0; i < 30; i++) {
    const n = await totalTries(page);
    const st = await answerRight(page);
    seen.push(st.skill);
    await waitNext(page, n);
  }
  const runs = [];
  for (const s of seen) {
    if (runs.length && runs[runs.length - 1].skill === s) runs[runs.length - 1].n += 1;
    else runs.push({ skill: s, n: 1 });
  }
  runs.slice(0, -1).forEach((r, i) => {
    expect(r.n, `block ${i} (${r.skill})`).toBeGreaterThanOrEqual(3);
    expect(r.n, `block ${i} (${r.skill})`).toBeLessThanOrEqual(4);
  });
  expect(runs.length).toBeGreaterThanOrEqual(7);
  for (const p of ['letters', 'starts', 'subtraction']) expect(seen).not.toContain(p);
});

test('right answer: green card, praise, a sticker, stats recorded', async ({ page }) => {
  await openApp(page, { ...FAST, rightPauseMs: 3000 });
  await force(page, 'numbers');
  const st = await answerRight(page);
  await expect(page.locator(`#answers .card[data-i="${st.q.answer}"]`)).toHaveClass(/right/);
  await expect(page.locator('.slot-sticker.on')).toHaveCount(1);
  expect(await spoken(page)).toContain(st.q.praise);
  expect(await soundLog(page)).toEqual(expect.arrayContaining(['chime', 'applause']));
  const s = (await page.evaluate(() => window.SkillMix.stats())).numbers;
  expect(s).toMatchObject({ level: 1, correct: 1, firstTry: 1, misses: 0 });
  expect(s.totalMs).toBeGreaterThan(0);
});

test('a wrong answer stays: it can be tapped again, nothing is taken away or answered for him', async ({ page }) => {
  await openApp(page, { ...FAST, explainMs: 5000 });
  await force(page, 'shapes');
  const st = await answerWrong(page);
  const wrongCard = page.locator(`#answers .card[data-i="${1 - st.q.answer}"]`);
  const rightCard = page.locator(`#answers .card[data-i="${st.q.answer}"]`);
  await expect(wrongCard).toHaveClass(/wrong/);
  expect(await soundLog(page)).toContain('boop');
  await expect(page.locator('#prompt .ghost-shape')).toHaveCount(1); // shows why: the picked shape over the target
  await expect(wrongCard).not.toHaveClass(/faded/);
  await expect(rightCard).not.toHaveClass(/hint|glow/);
  // he can make the same mistake again
  await answerWrong(page);
  expect((await state(page)).wrongs).toBe(2);
  await expect(rightCard).not.toHaveClass(/hint/);
  await answerWrong(page);
  await expect(rightCard).toHaveClass(/hint/); // after 3 tries the right one pulses
  await expect(rightCard).not.toHaveClass(/glow/);
  await answerWrong(page);
  await answerWrong(page);
  await expect(rightCard).toHaveClass(/glow/); // after 5 it glows
  await page.waitForTimeout(500);
  expect((await state(page)).busy).toBe(false); // still his turn: never answered for him
  const s = (await page.evaluate(() => window.SkillMix.stats())).shapes;
  expect(s.misses).toBe(5);
  expect(s.recentMisses.length).toBe(5);
  expect(s.recentMisses[0]).toEqual({ picked: st.q.labels[1 - st.q.answer], right: st.q.labels[st.q.answer] });
  await answerRight(page);
  await page.waitForFunction(() => window.SkillMix.stats().shapes.correct === 1);
  expect((await page.evaluate(() => window.SkillMix.stats())).shapes.firstTry).toBe(0);
});

test('the explanation of a mistake clears by itself, or as soon as he taps again', async ({ page }) => {
  await openApp(page, { ...FAST, explainMs: 400 });
  await force(page, 'shapes');
  await answerWrong(page);
  await expect(page.locator('#prompt .ghost-shape')).toHaveCount(1);
  await expect(page.locator('#prompt .ghost-shape')).toHaveCount(0, { timeout: 2000 });
});

test('which side he taps is recorded (left/right habit)', async ({ page }) => {
  await openApp(page);
  await force(page, 'shapes');
  await page.locator('#answers .card[data-i="0"]').click({ force: true });
  const taps = (await page.evaluate(() => window.SkillMix.stats())).shapes.taps;
  expect(taps[0]).toBe(1);
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
  await page.waitForFunction(() => window.SkillMix.state().ready && window.SkillMix.state().stickers === 0);
  await expect(page.locator('.slot-sticker.on')).toHaveCount(0);
});

test('when the session time is up, the current question finishes and a trophy screen ends it', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.SkillMix.endTime());
  await answerRight(page);
  await expect(page.locator('#trophy')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#start')).toBeVisible();
  expect(await spoken(page)).toContain('All done! Great playing!');
  // ▶️ starts a new session
  await page.locator('#playBtn').click({ force: true });
  await waitReady(page);
  expect((await state(page)).timeUp).toBe(false);
  await expect(page.locator('#trophy')).toBeHidden();
});

test('🔊 says the question again', async ({ page }) => {
  await openApp(page);
  const st = await state(page);
  await page.evaluate(() => { window.SkillMix.spoken.length = 0; });
  await page.locator('#replayBtn').click({ force: true });
  expect(await spoken(page)).toEqual([st.q.say]);
});

test('after a quiet spell the question is repeated and the hand points at the answers', async ({ page }) => {
  await openApp(page, { ...FAST, idleHintMs: 1500 });
  const st = await state(page);
  await page.evaluate(() => { window.SkillMix.spoken.length = 0; });
  await page.waitForFunction((say) => window.SkillMix.spoken.includes(say), st.q.say, { timeout: 5000 });
  await expect(page.locator('#hand')).toBeVisible();
});

test('number keys 1–4 pick the cards (keyboard)', async ({ page }) => {
  await openApp(page);
  await force(page, 'shapes');
  const st = await state(page);
  await page.keyboard.press(String(st.q.answer + 1));
  await page.waitForFunction(() => window.SkillMix.stats().shapes.correct === 1);
});

test('counting the animals by tapping them lights up the matching number', async ({ page }) => {
  await openApp(page);
  await force(page, 'counting');
  const n = (await state(page)).q.data.n;
  const critters = page.locator('#prompt .critter');
  await expect(critters).toHaveCount(n);
  for (let i = 0; i < n; i++) await critters.nth(i).click({ force: true });
  await expect(page.locator('#prompt .critter .badge')).toHaveText(Array.from({ length: n }, (_, i) => String(i + 1)));
  await expect(page.locator(`#answers .card[data-label="${n}"]`)).toHaveClass(/hint/);
  await critters.first().click({ force: true }); // already counted
  expect((await state(page)).counted).toBe(n);
});

test.describe('touch', () => {
  async function pointer(page, sel, type, opts) {
    await page.evaluate(([s, t, o]) => {
      const el = document.querySelector(s);
      const r = el.getBoundingClientRect();
      const x = o.x ?? r.left + r.width / 2, y = o.y ?? r.top + r.height / 2;
      el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: o.id, pointerType: o.ptype || 'touch', clientX: x, clientY: y, width: o.w || 20, height: o.w || 20, isPrimary: o.id === 1 }));
    }, [sel, type, opts]);
  }

  test('an answer counts when the finger lifts on the card, not when it lands', async ({ page }) => {
    await openApp(page);
    await force(page, 'shapes');
    const { q } = await state(page);
    const sel = `#answers .card[data-i="${q.answer}"]`;
    await pointer(page, sel, 'pointerdown', { id: 1 });
    expect((await state(page)).busy).toBe(false);
    await pointer(page, sel, 'pointerup', { id: 1 });
    await page.waitForFunction(() => window.SkillMix.stats().shapes.correct === 1);
  });

  test('sliding off the card before lifting picks nothing', async ({ page }) => {
    await openApp(page);
    await force(page, 'shapes');
    const { q } = await state(page);
    const sel = `#answers .card[data-i="${q.answer}"]`;
    await pointer(page, sel, 'pointerdown', { id: 1 });
    await pointer(page, sel, 'pointerup', { id: 1, x: 5, y: 5 }); // lifted far away
    await page.waitForTimeout(200);
    expect((await page.evaluate(() => window.SkillMix.stats())).shapes.correct).toBe(0);
  });

  test('two fingers at once, or a palm, pick nothing', async ({ page }) => {
    await openApp(page);
    await force(page, 'shapes');
    const { q } = await state(page);
    const sel = `#answers .card[data-i="${q.answer}"]`;
    await pointer(page, sel, 'pointerdown', { id: 1 });
    await pointer(page, sel, 'pointerdown', { id: 2 });
    await pointer(page, sel, 'pointerup', { id: 1 });
    await pointer(page, sel, 'pointerup', { id: 2 });
    await page.waitForTimeout(100);
    await pointer(page, sel, 'pointerdown', { id: 3, w: 140 }); // a resting palm
    await pointer(page, sel, 'pointerup', { id: 3, w: 140 });
    await page.waitForTimeout(200);
    expect((await page.evaluate(() => window.SkillMix.stats())).shapes.correct).toBe(0);
    // a normal tap still works afterwards
    await pointer(page, sel, 'pointerdown', { id: 4 });
    await pointer(page, sel, 'pointerup', { id: 4 });
    await page.waitForFunction(() => window.SkillMix.stats().shapes.correct === 1);
  });
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

test('every game has a description of at most 3 words', async ({ page }) => {
  await openStart(page);
  const labels = await page.evaluate(() => window.SkillMix.labels);
  expect(Object.keys(labels)).toHaveLength(10);
  for (const [id, label] of Object.entries(labels)) {
    expect(label.split(/\s+/).filter(Boolean).length, `${id}: "${label}"`).toBeLessThanOrEqual(3);
  }
});
