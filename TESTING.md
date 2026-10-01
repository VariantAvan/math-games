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
| E.1 | The start screen shows ▶️ and the mascots of the 7 games in play, with nothing asked yet. |
| E.2 | Enter or Space also starts. |
| E.3 | A game opens with an intro: mascot, icon, a 2–3 word description and the jingle. Then comes the demo: 👀 at the top, the 👆 hand, a "Grown-ups:" tip, then "Your turn!". Then the question, with the same mascot and description in its name tag. The question is spoken, and the demo earns no sticker. |
| E.4 | In the demo the hand answers its example correctly (the right card turns green). |
| E.5 | Tapping the intro, or the demo, skips it. |
| E.6 | Over 30 questions, games come in blocks of 3–4 and then switch, with at least 7 blocks. Paused games never come up. |
| E.7 | Right answer: green card, chime and applause, praise spoken, a sticker. The record gets correct, firstTry, misses = 0 and the time. |
| E.8 | **Wrong answers stay:** the card wobbles with a "boop", the explanation shows, nothing fades and he can pick the same card again. The right card starts pulsing only after 3 tries and glows after 5. It is never answered for him. The record counts the misses and remembers what was picked instead of what. |
| E.9 | An explanation clears by itself after a moment. |
| E.10 | Which card he taps (left or right) is recorded. |
| E.11 | Five stickers: fanfare, fireworks, then the sticker row empties. |
| E.12 | When the session time is up, the current question finishes, then the 🏆 screen says "All done!". ▶️ starts a new session. |
| E.13 | 🔊 speaks the question again. |
| E.14 | After a quiet spell the question is spoken again and the hand points at the answers. |
| E.15 | Keys 1–4 pick the cards. |
| E.16 | Tapping each animal counts it (1, 2, 3…). When all are counted, the matching number card lights up. Tapping one twice doesn't count it again. |
| E.17 | **Touch:** an answer counts on finger *lift*, not touch-down. Lifting off the card picks nothing. Two fingers at once, or a palm-sized touch, pick nothing, and a normal tap still works afterwards. |
| E.18 | The record survives a reload. |
| E.19 | Every game's description is at most 3 words. |

## The games: `tests/02-skills.spec.js`

| # | Test |
|---|---|
| K.1 | For every game, 300 generated level-1 questions follow its rules (below). Each has 2 different choices, and the right answer appears on both sides over the run. |
| K.2 | Each of the 10 games looks right on screen, shows its description, is spoken, can be answered, and the praise is spoken. A ❓ fills in with the answer. |
| K.3 | Adding: the groups start apart, then the second walks over and joins the first (one group of a + b, the "+" gone). |
| K.4 | **Mistakes are explained.** Find the number: the picked number's dots appear. How many / Add them up: the picked number pairs with the animals (orange dots under min(n, pick), red extra dots for too many, missed animals pulse). Which has more: the paired items and exactly the leftover items light up. What comes next: the gap shows the picked colour and "breaks". Same shape: the picked shape is laid over the target. |
| K.5 | Word jumble: a wrong tile bounces off and fills nothing. After three misses the right tile glows, and a right tile fills the slot. |
| K.6 | Word jumble can be typed on a keyboard. |

The level-1 rules the generator is checked against:

| Game | Rule |
|---|---|
| Find the number | Choices 1–5. The question shows that many dots. |
| How many? | 1–6 animals. The answer is the count. |
| Add them up | a, b ≥ 1 and a + b ≤ 5. Choices 1–5. |
| Which has more? | Two plates, one with at least twice as much, up to 10. The answer is the bigger plate. |
| What comes next? | Alternating A B A B… of two colours that don't look alike. |
| Same shape | Circle, square, triangle, star or heart. |
| Spell the word | One of 10 three-letter words. The tiles are never already in order. |
| First letter (paused) | A picture word; 2 capitals from A B D F M P S T, never a look-alike pair. |
| Starts with… (paused) | Letters A B D F M P S T. The spoken question includes the letter's sound. |
| Take away (paused) | From 2 or 3, at least 1 left. |

## Grown-ups sheet: `tests/03-parent.spec.js`

| # | Test |
|---|---|
| P.1 | A quick tap on ⚙️ does nothing. Press and hold opens the sheet with all 10 games, and Escape closes it. |
| P.2 | With only 2 games on, only those are asked. The choice is remembered after a reload. |
| P.3 | The last game that's on can't be switched off. |
| P.4 | "Try now" jumps straight to a game (even a paused one). |
| P.5 | Sound off silences everything and stays off after a reload. |
| P.6 | The sheet shows level, tries, right answers, first tries, wrong taps and average time. |
| P.7 | The sheet opens from the start screen too. |
| P.8 | Paused games (First letter, Starts with…, Take away) show **Paused**, have no on/off switch, and are never asked. |
| P.9 | Session length offers 5 / 8 / 10 / 15 min / No limit (default 5) and is remembered. |
| P.10 | Grown-up tips can be switched off, which hides the tip during demos. |
| P.11 | **Test voice** speaks and shows the voice status (voices on the device, sentences spoken, last problem). |
| P.12 | The sheet shows which side he tends to pick and his last mix-up. |

## Layout: `tests/04-layout.spec.js`

| # | Test |
|---|---|
| Y.1–Y.6 | On 360×640, 390×844, 667×375, 768×1024, 1024×768 and 1440×900, every one of the 10 skills fits: all answer cards and tiles are at least 64 px and fully on screen, the question is on screen and doesn't overlap the answers, there's no sideways scroll, and 🔊 is at least 64 px. A screenshot of each size is saved in `test-results/screens/`. |

## Manual checklist

**Voice (on the iPad)**
- [ ] Press ▶️: you should hear "Let's play!", then the questions.
- [ ] If not, press and hold ⚙️, then **Test voice**. Note what the status line says (number of voices, sentences spoken, any problem) and check the ring/silent switch and volume.

**Touch**
- [ ] Taps register when he lifts his finger. Resting his other hand on the screen doesn't pick anything.
- [ ] Holding a finger on a card and sliding away cancels it.

**Demos and blocks**
- [ ] He watches the demo and then copies it. Is the hand's pace right?
- [ ] 3–4 questions per game feels right: not boring, not too switchy.
- [ ] The grown-up tip is readable at the bottom during the demo.

**Mistakes**
- [ ] When he picks wrong, does he look at the explanation (dots lining up, leftovers lighting up)?
- [ ] Does he try again by himself? Does he ever repeat the same wrong card? (Check "last mix-up" in the sheet.)
- [ ] Is the pulse after 3 tries soon enough, or too soon?

**Engagement**
- [ ] With the session at 5 minutes, does he finish happily, and want more?
- [ ] Track over a few weeks: raise the session length when he regularly reaches the trophy.
- [ ] In the sheet, check the "picks left %". Around 50% is healthy; near 0% or 100% means he's tapping one side by habit.
