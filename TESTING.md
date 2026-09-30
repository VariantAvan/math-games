# Test plan: Skill Mix

- **Automated:** Playwright tests in `tests/` drive Chromium against `index.html` over `file://`.
- **Manual:** checks only a person can make: how it sounds, whether a toddler understands it without reading, and how it feels on a real device.

```bash
npm install
npm test             # headless
npm run test:headed  # watch it play
```

The page exposes a test hook, `window.SkillMix`:
- `state()` and `stats()` read the current question and the record;
- `force(skill)` jumps to a skill;
- `make(skill, level)` generates a question without showing it;
- `config` holds the timings, which the tests shorten;
- `spoken`, `soundLog` and `particles()` show what was said, played and drawn.

## The build: `tests/00-offline.spec.js`

| # | Test |
|---|---|
| 0.1 | No external scripts, stylesheets, fonts, images, audio, `fetch` or `http(s)` URLs in `index.html`. |
| 0.2 | With the network **offline**, 12 questions in a row make **zero** network requests and raise no errors. |
| 0.3 | No audio starts until ▶️ is tapped. Then the audio context is running. |
| 0.4 | Toddler-proofing: `user-select: none`, `touch-action: manipulation`, `overscroll-behavior: none`, `user-scalable=no`. |

## The question engine: `tests/01-engine.spec.js`

| # | Test |
|---|---|
| E.1 | The start screen shows ▶️ and the 10 mascots, and nothing is asked or spoken yet. |
| E.2 | Enter or Space also starts. |
| E.3 | Each question opens with the skill's mascot, icon, jingle and a 2–3 word description. The same mascot and description then sit in a name tag by the question, and the question is spoken. |
| E.4 | Tapping the intro skips it. |
| E.5 | Over 25 questions, the same skill never comes twice in a row, at least 6 different skills appear, and Taking away (paused) never comes up. |
| E.15 | Every game has a description of at most 3 words. |
| E.6 | Right answer: green card, chime + applause, the praise is spoken, a sticker is added, and the record gets tries / correct / firstTry / time. |
| E.7 | Wrong answer: wobble, "uh-oh" and "Try again!". The card fades and the right card glows. The faded card can't be tapped. Right after a miss counts as correct but not first try. |
| E.8 | Five stickers: fanfare, fireworks and "Hooray! Five stickers!". Then the sticker row empties and play continues. |
| E.9 | 🔊 speaks the question again. |
| E.10 | The first time a skill appears, the 👆 hand demonstrates. |
| E.11 | After a quiet spell the question is spoken again and the hand appears. |
| E.12 | Keys 1–4 pick the cards. |
| E.13 | Animals in a question can be tapped to count them (badges 1, 2, 3). Tapping one twice doesn't count it again. |
| E.14 | The record is still there after reloading the page. |

## The ten skills: `tests/02-skills.spec.js`

| # | Test |
|---|---|
| K.1 | For every skill, 300 generated level-1 questions follow its rules (below). Each has 2 different choices, and the right answer appears on both sides over the run. |
| K.2 | For each of the 10 skills, the question looks right on screen, shows the game's description, is spoken, can be answered, and the praise is spoken. Where there's a ❓, it fills in with the answer. |
| K.3 | Word jumble: a wrong tile fills nothing and says which letter to find. After two misses the right tile glows. A right tile fills the slot and moves the highlight on. |
| K.4 | Word jumble can be typed on a keyboard. |

The level-1 rules the generator is checked against:

| Skill | Rule |
|---|---|
| Numbers | Choices 1–3. The question shows that many dots. |
| First letter | A picture from the word list; choices are 2 capitals from A B D F M P S T, never a look-alike pair (B/P, B/D, F/P). The answer is the picture word's first letter. The question shows the picture, not a letter. |
| Counting | 1–3 animals. The answer is the count. |
| Starts with… | Letters A B D F M P S T. The right picture word starts with the letter and the other doesn't. The spoken question includes the letter's sound from `LETTER_SOUND`. |
| Adding | a, b ≥ 1 and a + b ≤ 3. Choices 1–4. |
| Taking away | From 2 or 3, at least 1 left. Choices 1–3. The leaving animals are crossed out. |
| Word jumble | One of the 10 three-letter words. Tiles are the word's letters, never already in order. |
| More or fewer | Groups of up to 5 that differ by at least 3. The answer is the bigger group. |
| What comes next | Alternating A B A B… of two colours that don't look alike (never red with orange, or blue with purple). The answer is the next one. |
| Shapes | Circle, square, triangle, star or heart. The answer is the same shape. |

## Grown-ups sheet: `tests/03-parent.spec.js`

| # | Test |
|---|---|
| P.1 | A quick tap on ⚙️ does nothing. Press and hold opens the sheet with all 10 skills, and Escape closes it. |
| P.2 | With only 2 skills on, only those are asked, alternating. The choice is remembered after a reload. |
| P.3 | The last skill that's on can't be switched off. |
| P.4 | "Try now" jumps straight to that skill. |
| P.5 | Sound off silences every sound and the voice, and stays off after a reload. |
| P.6 | The sheet shows each skill's level, tries, right answers, first tries and average time. |
| P.7 | The sheet can be opened from the start screen too. |
| P.8 | Taking away shows **Paused** (no on/off switch), is not in the rotation, and **Try now** still opens it. |

## Layout: `tests/04-layout.spec.js`

| # | Test |
|---|---|
| Y.1–Y.6 | On 360×640, 390×844, 667×375, 768×1024, 1024×768 and 1440×900, every one of the 10 skills fits: all answer cards and tiles are at least 64 px and fully on screen, the question is on screen and doesn't overlap the answers, there's no sideways scroll, and 🔊 is at least 64 px. A screenshot of each size is saved in `test-results/screens/`. |

## Manual checklist

**Voice and sound**
- [ ] On your iPad or phone, play each skill with **Try now**, and listen to how each question is spoken.
- [ ] Voice is optional: on devices where it doesn't work, check every game is still clear from its picture and description.
- [ ] Letter names are said as names ("bee", not "b" read as a word).
- [ ] Each skill's jingle is short and pleasant, and they sound different from each other.

**Understanding without reading** (with your child)
- [ ] After a few rounds, does your child know what to do from the mascot and the voice alone?
- [ ] Is the 👆 hand demo clear, or distracting?
- [ ] Does the child try to tap the animals to count them?
- [ ] Is "More or fewer" understood from "Which one has more?" alone?
- [ ] Word jumble: does the child match the faint letters?

**Feel**
- [ ] Wrong answers feel gentle, never like failing.
- [ ] Five stickers feel like a treat, and the party isn't too long.
- [ ] Nothing zooms, selects or scrolls when mashing the screen.
- [ ] Press and hold ⚙️ works for an adult, and a toddler's taps don't open it.
