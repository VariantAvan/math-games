// The ten skills at level 1: every generated question is in range, renders right and can be answered.
const { test } = require('@playwright/test');
const { FAST, openStart, openApp, state, spoken, force, answerRight, expect } = require('./helpers');

const STARTS_L1 = ['A', 'B', 'D', 'F', 'M', 'P', 'S', 'T'];
const LOOKALIKE = ['BP', 'PB', 'BD', 'DB', 'FP', 'PF'];
const JUMBLE_L1 = ['CAT', 'DOG', 'SUN', 'BUS', 'PIG', 'HAT', 'COW', 'FOX', 'BED', 'CUP'];
const SHAPES_L1 = ['circle', 'square', 'triangle', 'star', 'heart'];
const inRange = (lo, hi) => (v) => Number(v) >= lo && Number(v) <= hi;

// For each skill: a check that one generated level-1 question follows the rules.
const RULES = {
  numbers: (q) => q.labels.every(inRange(1, 3)) && q.labels[q.answer] === String(q.data.n),
  letters: (q) => q.labels.every((l) => STARTS_L1.includes(l)) && q.labels[q.answer] === q.data.letter
    && q.data.word[0].toUpperCase() === q.data.letter && !LOOKALIKE.includes(q.labels.join('')),
  counting: (q) => q.labels.every(inRange(1, 3)) && q.labels[q.answer] === String(q.data.n),
  starts: (q) => STARTS_L1.includes(q.data.letter) && q.labels[q.answer] === q.data.word
    && q.data.word[0].toUpperCase() === q.data.letter && q.data.distractor[0].toUpperCase() !== q.data.letter,
  addition: (q) => q.data.a + q.data.b <= 3 && q.data.a >= 1 && q.data.b >= 1 && q.labels[q.answer] === String(q.data.a + q.data.b)
    && q.labels.every(inRange(1, 4)),
  subtraction: (q) => q.data.a <= 3 && q.data.a - q.data.b >= 1 && q.labels[q.answer] === String(q.data.a - q.data.b)
    && q.labels.every(inRange(1, 3)),
  jumble: (q) => JUMBLE_L1.includes(q.word) && q.tiles.join('') !== q.word && [...q.tiles].sort().join('') === [...q.word].sort().join(''),
  compare: (q) => Math.abs(q.data.a - q.data.b) >= 3 && Math.max(q.data.a, q.data.b) <= 5
    && q.labels[q.answer] === String(Math.max(q.data.a, q.data.b)),
  pattern: (q) => q.data.seq.every((c, i) => c === q.data.seq[i % 2]) && q.data.seq[0] !== q.data.seq[1]
    && q.data.next === q.data.seq[q.data.seq.length % 2] && q.labels[q.answer] === q.data.next
    && ![['red', 'orange'], ['blue', 'purple']].some(([x, y]) => q.labels.includes(x) && q.labels.includes(y)),
  shapes: (q) => q.labels.every((s) => SHAPES_L1.includes(s)) && q.labels[q.answer] === q.data.shape,
};

test('every skill: 300 generated level-1 questions follow the rules, with 2 different choices', async ({ page }) => {
  await openStart(page);
  const skills = await page.evaluate(() => window.SkillMix.skills);
  expect(skills).toEqual(Object.keys(RULES));
  for (const id of skills) {
    const qs = await page.evaluate((s) => Array.from({ length: 300 }, () => window.SkillMix.make(s, 1)), id);
    const answersSeen = new Set();
    for (const q of qs) {
      expect(RULES[id](q), `${id}: ${JSON.stringify(q)}`).toBe(true);
      if (q.kind !== 'jumble') {
        expect(q.labels).toHaveLength(2);
        expect(new Set(q.labels).size).toBe(2);
        answersSeen.add(q.answer);
      }
    }
    if (id !== 'jumble') expect(answersSeen.size, `${id}: the right answer should be on both sides`).toBe(2);
  }
});

const SKILLS = Object.keys(RULES);
for (const id of SKILLS) {
  test(`${id}: renders, is spoken and can be answered`, async ({ page }) => {
    await openApp(page, { ...FAST, rightPauseMs: 2500 }); // keep the answered question on screen to check it
    await force(page, id);
    const st = await state(page);
    expect(await spoken(page)).toContain(st.q.say);
    const labels = await page.evaluate(() => window.SkillMix.labels);
    await expect(page.locator('#prompt .tag .tag-text')).toHaveText(labels[id]);
    const d = st.q.data;
    const prompt = page.locator('#prompt');
    if (id === 'numbers') await expect(prompt.locator('.bubble .dots i')).toHaveCount(d.n);
    if (id === 'letters') {
      await expect(prompt.locator('.bubble .emoji')).toHaveCount(1); // a picture, not a letter
      await expect(page.locator('#answers .card')).toHaveText(st.q.labels);
    }
    if (id === 'counting') await expect(prompt.locator('.critter')).toHaveCount(d.n);
    if (id === 'starts') {
      await expect(prompt.locator('.bubble')).toHaveText(d.letter);
      const sound = await page.evaluate((l) => window.SkillMix.letterSound[l], d.letter);
      expect(st.q.say).toContain(sound);
    }
    if (id === 'addition') {
      await expect(prompt.locator('.group').nth(0).locator('.critter')).toHaveCount(d.a);
      await expect(prompt.locator('.group').nth(1).locator('.critter')).toHaveCount(d.b);
    }
    if (id === 'subtraction') {
      await expect(prompt.locator('.critter')).toHaveCount(d.a);
      await expect(prompt.locator('.critter.gone')).toHaveCount(d.b, { timeout: 3000 });
    }
    if (id === 'jumble') {
      await expect(prompt.locator('.jslot .ghost')).toHaveText(st.q.word.split(''));
      await expect(page.locator('#answers .tile')).toHaveText(st.q.tiles);
    }
    if (id === 'compare') await expect(page.locator('#answers .card .critter')).toHaveCount(d.a + d.b);
    if (id === 'pattern') await expect(prompt.locator('.pitem')).toHaveCount(d.seq.length);
    if (id === 'shapes') await expect(prompt.locator('.bubble svg')).toHaveCount(1);
    await answerRight(page);
    await page.waitForFunction((s) => window.SkillMix.stats()[s].correct === 1, id);
    expect(await spoken(page)).toContain(st.q.praise);
    if (['counting', 'addition', 'subtraction', 'pattern'].includes(id)) await expect(prompt.locator('.qmark')).toHaveClass(/done/);
  });
}

test('word jumble: a wrong tile says which letter to find, then glows it after two misses', async ({ page }) => {
  await openApp(page);
  await force(page, 'jumble');
  const { q } = await state(page);
  const wrong = q.tiles.find((l) => l !== q.word[0]);
  const names = { C: 'see', D: 'dee', S: 'ess', B: 'bee', P: 'pee', H: 'aitch', F: 'ef' };
  await page.locator(`#answers .tile[data-l="${wrong}"]`).click({ force: true });
  expect((await state(page)).jpos).toBe(0);
  await expect(page.locator('#prompt .jslot.filled')).toHaveCount(0);
  if (names[q.word[0]]) expect(await spoken(page)).toContain(`Find ${names[q.word[0]]}.`);
  await page.locator(`#answers .tile[data-l="${wrong}"]`).click({ force: true });
  await expect(page.locator(`#answers .tile[data-l="${q.word[0]}"]`)).toHaveClass(/glow/);
  await page.locator(`#answers .tile[data-l="${q.word[0]}"]`).click({ force: true });
  await expect(page.locator('#prompt .jslot.filled')).toHaveText([q.word[0]]);
  await expect(page.locator('#prompt .jslot.next')).toHaveAttribute('data-i', '1');
});

test('word jumble can be typed on a keyboard', async ({ page }) => {
  await openApp(page);
  await force(page, 'jumble');
  const { q } = await state(page);
  for (const l of q.word) await page.keyboard.press(l.toLowerCase());
  await page.waitForFunction(() => window.SkillMix.stats().jumble.correct === 1);
});
