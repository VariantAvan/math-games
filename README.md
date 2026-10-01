# Skill Mix 🦉

A **100% offline** learning game for toddlers. The child presses ▶️ and plays short blocks of one game at a time: counting, numbers, adding, comparing amounts, patterns, shapes and word building. Every game opens with a demo, is answered by tapping big pictures, and explains mistakes instead of taking them away.

The whole app is one file, [`index.html`](index.html). Open it in any browser, even offline, straight from disk (`file://`).

> This branch replaces the earlier Add Along / Take Away / Count Quickly games with this new concept. Those games are still on `main`.

## How a session works

1. Press ▶️. Speech is started from this tap, so Safari lets the voice talk.
2. **Games come in blocks of 3–4 questions**, then switch to a different game. Each block opens with:
   - **an intro (about 1 second):** the game's mascot, icon, colour, jingle and a 2–3 word description;
   - **a demo:** 👀 at the top, and a 👆 hand plays one example (counting the animals, tapping the right card), then **"Your turn!"**. A short tip for grown-ups shows at the bottom (switchable).
   Tap to skip either one.
3. **Answer by tapping** a big card, or putting letter tiles in order. An answer counts when the finger **lifts** on the same card. A resting palm, several fingers at once, or sliding off the card picks nothing.
4. **Right:** the card turns green, you hear a chime and applause, confetti falls and a sticker is added. 5 stickers bring a big party.
5. **Wrong:** the card wobbles, and the game **shows what that pick means** (see below). Nothing is taken away, and he can try again, even the same card. After 3 tries the right card gently pulses, and after 5 it glows. The game never answers for him.
6. **Session length** (grown-ups setting, default 5 minutes): when time is up, the current question finishes and a 🏆 screen ends the session.

**Built-in help:**
- After 8 quiet seconds, the question is spoken again and the hand points at each answer.
- In counting games, tapping each animal counts it (1, 2, 3…). Once every animal is counted, the matching number card lights up.

## The games

Level 1 is tuned for a 3-year-old who counts to 10 but doesn't yet compare amounts. [PLAN.md](PLAN.md) explains why.

| Game | Mascot | Level 1 | A wrong pick shows… |
|---|---|---|---|
| Find the number | 🦉 | Numbers 1–5: the question shows dots, and each card shows a numeral with its dots | the picked number's dots lined up under the question's dots |
| How many? | 🐿️ | 1–6 animals in a row; tap to count | an orange dot under each animal the pick covers; extras in red; missed animals pulse |
| Add them up | 🐻 | Sums up to 5: the second group walks over and joins the first, then count | the same pairing as How many? |
| Which has more? | 🐘 | Two plates of food, one with at least twice as much (up to 10), in rows of 5 | the plates paired one to one, with the leftovers lit up |
| What comes next? | 🐛 | 🔴🔵🔴🔵🔴❓ | the picked colour in the gap, and the pattern breaking |
| Same shape | 🦊 | Circle, square, triangle, star or heart | the picked shape laid over the target |
| Spell the word | 🐙 | 3-letter words with faint letters in the slots | the tile bouncing off the slot |
| First letter | 🐝 | **Paused:** picture → its first letter (needs letter sounds, usually ages 4–5) | |
| Starts with… | 🦜 | **Paused:** needs a working voice | |
| Take away | 🐰 | **Paused:** to be reworked | |

Paused games stay in the code and can still be opened with **Try now**.

## Voice

Questions are spoken with the browser's built-in voice. No external service is needed, and none could be used offline. On iPad/iPhone, Safari stays silent unless the page's first sentence starts inside a tap. The app now says "Let's play!" from the ▶️ tap, and starts speech on any tap. If it's still silent, open **Grown-ups → Test voice**. It speaks a sentence and shows how many voices the device has, how many sentences were spoken and the last problem reported. Check the iPad's ring/silent switch and volume too.

## Grown-ups

**Press and hold ⚙️** (top right, also on the start screen) for about a second. A quick toddler tap does nothing.

| Setting | What it does |
|---|---|
| Sound and voice | Turn all sound on or off. |
| Test voice | Speak a sentence and show the voice status. |
| Session length | 5, 8, 10 or 15 minutes, or no limit. |
| Grown-up tips during demos | Show or hide the tip line. |
| Each game | On/Off (paused games show Paused) and **Try now**. |

Each game's record is kept on the device and shown in the sheet:
- level and tries;
- right answers, and right on the first try;
- wrong taps;
- average time per right answer;
- **which side he picks** (left %, a common toddler habit that hides real understanding);
- his **last mix-up** (e.g. picked 3 for 5).

## Plan

[PLAN.md](PLAN.md) has the full concept:
- who it's tuned for, and the research behind each design choice;
- how each game explains a mistake;
- the difficulty ladder for each skill;
- new skill areas that open up at higher levels;
- how automatic levelling will work.

## Tests

```bash
npm install
npm test
```

See [TESTING.md](TESTING.md) for what the automated tests check and a manual checklist.

## How it's built

- **No external anything:** no frameworks, CDNs, fonts, images or audio files. Pictures are emoji, and shapes are inline SVG.
- **Sounds are synthesized** with the Web Audio API: skill jingles, pops, chimes, a soft "uh-oh", applause and a fanfare.
- **Speech** uses the browser's built-in `speechSynthesis`, started from a tap so Safari allows it. Without it the game is silent but still playable.
- **Fireworks and confetti** come from a small canvas particle system. It respects `prefers-reduced-motion`.
- **Toddler-proofing:** no text selection, pinch or double-tap zoom, pull-to-refresh or long-press menus. Answers register on finger lift, and palms or several fingers at once are ignored.
