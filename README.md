# Skill Mix 🦉

A **100% offline** learning game for toddlers. Instead of picking a game, the child presses ▶️. After that, one short question at a time comes from a random skill: numbers, first letters, counting, letter sounds, adding, word building, comparing, patterns or shapes. Each question has its own mascot, colours, jingle and a 2–3 word description, and is answered by tapping big pictures. Questions are also spoken where the browser's voice works.

> **Voice:** speech doesn't work on every device (it didn't on the iPad this was tried on), so nothing depends on it. The game is playable silently.

The whole app is one file, [`index.html`](index.html). Open it in any browser, even offline, straight from disk (`file://`).

> This branch replaces the earlier Add Along / Take Away / Count Quickly games with this new concept. Those games are still on `main`.

## How a question works

1. **Intro (about 1 second):** the skill's mascot and icon appear on its own colour, with a short jingle. The child learns "the owl means numbers" without words. Tap to skip.
2. **The question is spoken** ("Find 2!", "Which one has more?"). 🔊 top right always says it again.
3. **Answer by tapping** one of the big cards, or putting letter tiles in order for word jumble.
   - **Right:** the card turns green, you hear a chime and applause, confetti falls and a sticker is added.
   - **Wrong:** the card wobbles and fades away, and "Try again!" is spoken. With two cards, the right one then glows, so every question ends in success.
4. **Five stickers** bring a big party with fireworks, a fanfare and all the mascots dancing. Then the sticker row starts again.

**Built-in help:**
- The first time each skill appears, a 👆 hand demonstrates tapping the cards.
- After 7 quiet seconds, the question is spoken again and the hand shows what to do.
- Animals in a question can be tapped to count them (1, 2, 3…).

## The ten skills (all at level 1 for now)

Each game shows a short **description** (2–3 words) in its intro and next to the mascot on every question, so a grown-up can tell at a glance what is being asked even when the voice doesn't work.

| Skill | Mascot | Description | Level 1 |
|---|---|---|---|
| Numbers | 🦉 | Find the number | Numerals 1–3, each with dots under it; the question shows that many dots. |
| First letter | 🐝 | Which first letter? | A picture (🐶): tap the capital letter it starts with, from 2 (D or P). Letters A B D F M P S T, never a look-alike pair such as B and P. |
| Counting | 🐿️ | How many? | 1–3 animals; 2 numeral cards with dots. |
| Starts with… | 🦜 | Starts with… | A big capital (its sound is spoken where the voice works). Tap the picture that starts with it (🐷 or 🐟). |
| Adding | 🐻 | Add them up | 1+1, 1+2 or 2+1 with animals; 2 answer cards. |
| Taking away | 🐰 | Take away | **Paused**: not in the rotation for now (still reachable with Try now). |
| Word jumble | 🐙 | Spell the word | Picture plus 3 slots with faint letters (C A T). Tap the tiles in order. |
| More or fewer | 🐘 | Which has more? | Two groups that are easy to tell apart (e.g. 1 vs 4). |
| What comes next | 🐛 | What comes next? | 🔴🔵🔴🔵🔴❓ Tap the next colour. |
| Shapes | 🦊 | Same shape | Tap the same shape (circle, square, triangle, star or heart). |

Letters are **capitals only** for now.

**Letter sounds:** "Starts with…" says each letter's sound. The spellings the voice uses are in one table, `LETTER_SOUND` in `index.html` (e.g. `F: 'fff'`, `P: 'puh'`). Speech voices differ between devices, so if a sound comes out wrong, change its spelling there.

## Grown-ups

**Press and hold ⚙️** (top right, also on the start screen) for about a second. A quick toddler tap does nothing. The sheet shows:
- **Sound and voice** on/off.
- **Each skill switched on or off.** At least one stays on, and the choice is remembered on the device. Paused skills (Taking away, for now) show **Paused** and are never asked.
- **Try now:** jump straight to a skill (handy for checking the letter sounds).
- **Each skill's record:** level, tries, right answers, right on the first try, and average time per right answer.

The record is kept on the device (browser storage) from the first question. The next iteration will use it to move each skill up (or down) a level automatically.

## Plan

[PLAN.md](PLAN.md) has the full concept:
- the difficulty ladder for each skill;
- new skill areas that open up at higher levels;
- the "no reading needed" design rules;
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
- **Speech** uses the browser's built-in `speechSynthesis`. Without it the game is silent but still playable.
- **Fireworks and confetti** come from a small canvas particle system. It respects `prefers-reduced-motion`.
- **Toddler-proofing:** no text selection, pinch or double-tap zoom, pull-to-refresh or long-press menus. Taps register on touch-down.
