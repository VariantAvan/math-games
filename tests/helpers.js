const path = require('path');
const { expect } = require('@playwright/test');

const APP_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

// Short timings so tests don't wait for the real (toddler-paced) pauses.
const FAST = { introMs: 60, rightPauseMs: 150, wrongMs: 80, bigPartyMs: 300 };

async function openStart(page, config = FAST) {
  await page.goto(APP_URL);
  await page.waitForFunction(() => window.SkillMix);
  if (config) await page.evaluate((c) => Object.assign(window.SkillMix.config, c), config);
}

/** Open the app, press ▶️ and wait for the first question. */
async function openApp(page, config = FAST) {
  await openStart(page, config);
  await page.locator('#playBtn').click({ force: true });
  await waitReady(page);
}

const state = (page) => page.evaluate(() => window.SkillMix.state());
const spoken = (page) => page.evaluate(() => [...window.SkillMix.spoken]);
const soundLog = (page) => page.evaluate(() => [...window.SkillMix.soundLog]);

/** Wait until a question is on screen (optionally a given skill) and can be answered. */
const waitReady = (page, skill) => page.waitForFunction((s) => {
  const st = window.SkillMix.state();
  return st.ready && (!s || st.skill === s);
}, skill || null);

/** Jump straight to a skill's question. */
async function force(page, skill) {
  await page.evaluate((s) => window.SkillMix.force(s), skill);
  await waitReady(page, skill);
}

/** Tap the right answer (the right card, or every jumble tile in order). */
async function answerRight(page) {
  const st = await state(page);
  if (st.q.kind === 'jumble') {
    for (const l of st.q.word) await page.locator(`#answers .tile[data-l="${l}"]:not(.used)`).first().click({ force: true });
  } else {
    await page.locator(`#answers .card[data-i="${st.q.answer}"]`).click({ force: true });
  }
  return st;
}

/** Tap a wrong card (choice questions). */
async function answerWrong(page) {
  const st = await state(page);
  const wrongIndex = st.q.labels.findIndex((_, i) => i !== st.q.answer);
  await page.locator(`#answers .card[data-i="${wrongIndex}"]`).click({ force: true });
  return st;
}

/** Wait for the next question after a right answer. */
const waitNext = (page, prevCount) => page.waitForFunction((n) => {
  const st = window.SkillMix.state();
  return st.ready && Object.values(window.SkillMix.stats()).reduce((t, s) => t + s.tries, 0) > n;
}, prevCount);

const totalTries = (page) => page.evaluate(() => Object.values(window.SkillMix.stats()).reduce((t, s) => t + s.tries, 0));

module.exports = { APP_URL, FAST, openStart, openApp, state, spoken, soundLog, waitReady, force, answerRight, answerWrong, waitNext, totalTries, expect };
