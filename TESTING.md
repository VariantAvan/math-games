# Test Plan — Add Along! (Toddler Math)

Two kinds of checks for each stage of the game:

- **Automated**: Playwright tests in `tests/`, run with `npm test`. They drive a real Chromium browser against `index.html` over `file://`.
- **Manual**: things a script can't judge, like how it sounds, how it feels to touch, how it reads on a real device, and whether a toddler gets it.

```bash
npm install          # one time: installs @playwright/test
npm test             # full suite, headless
npm run test:headed  # watch it play in a visible browser
```

The page exposes a small test hook, `window.ToddlerMath`, with `getState()`, `reset()`, `config`, `soundLog`, `spoken`, `particles()` and `audioState()`. The tests use it to check internal state and to confirm that sounds and speech were requested. Tests can also change timing through `ToddlerMath.config`, for example to shorten the auto-reset.

---

## Stage 0: Build, offline and toddler-proofing

**Automated** (`tests/00-offline.spec.js`)

| # | Test |
|---|------|
| 0.1 | `index.html` has no `<script src>`, no stylesheet links, no `@import`, no audio/font/image files, no `http(s)` URLs (except the SVG namespace in the inline favicon), and no `fetch`/`XMLHttpRequest`/`new Audio`. |
| 0.2 | With the browser set **offline**, a full round works and the page makes **zero** requests other than `file:`/`data:`. |
| 0.3 | A full round (wrong answer, right answer, Play Again) raises no console errors and no uncaught exceptions. |
| 0.4 | No `AudioContext` exists before the first interaction; after the first tap it exists and is `running`. |
| 0.5 | `user-select: none`, `touch-action: manipulation` and `overscroll-behavior: none` are set, and the viewport meta includes `user-scalable=no`. |

**Manual**

- [ ] Turn on airplane mode / unplug the network. Open `index.html` by double-clicking it (`file://`). Play 3 rounds.
- [ ] Open DevTools → Network, reload, and confirm only `index.html` loads.
- [ ] Try it in Chrome, Safari (macOS and iPad), Firefox and Edge.
- [ ] iPad/iPhone: pinch and double-tap to zoom. The page must not zoom.
- [ ] iPad/iPhone: long-press an animal or key. No copy/lookup menu should appear and no text should be selected.
- [ ] Android Chrome: pull down from the top. The page must not pull-to-refresh.
- [ ] Emojis render in colour, look alike across devices, and have a soft drop shadow.

---

## Welcome screen: choose an activity

**Automated** (`tests/06-welcome.spec.js`)

| # | Test |
|---|------|
| W.1 | The app opens on the welcome screen ("Let’s play math!") with 3 playable activity cards: **Add Along**, **Take Away** and **Count Quickly**. The games are hidden. |
| W.2 | On a phone (375×667), each card is at least 150×140 px and there is no horizontal scroll. |
| W.3 | Tapping **Add Along** opens the game at step 1, the URL becomes `…#addition`, and "Pick the first number!" is spoken. |
| W.4 | Pressing Enter on the welcome screen starts Add Along. |
| W.5 | Digit keys do nothing on the welcome screen. |
| W.7 | The 🏠 Home button mid-round goes back to the welcome screen and clears the round. |
| W.8 | The browser's Back button from the game goes back to the welcome screen. |
| W.9 | Opening `index.html#addition` directly skips the welcome screen (and a reload stays in the game). |
| W.10 | Going Home from Add Along and picking Take Away switches the game (title, `#subtraction` URL). |

**Manual**

- [ ] The welcome screen fits and looks good on a phone (portrait and landscape), a tablet and a laptop. On a phone the cards stack and scroll.
- [ ] Cards press down visibly when tapped, and the Play! pill gently pulses.
- [ ] 🏠 during the celebration closes the fireworks and returns home cleanly.
- [ ] Android: the system Back gesture from the game returns to the welcome screen.

---

## Stage 1: Pick the first number

**Automated** (`tests/01-first-number.spec.js`)

| # | Test |
|---|------|
| 1.1 | Loads on step 1: prompt reads "Pick the first number!", first slot shows a pulsing `?`, no animals, step dot 1 is active, and "Count with me!" is greyed out. |
| 1.2 | Tapping **1**, **5** or **9** shows that numeral in the slot and in the group badge, and draws **exactly** that many animals. |
| 1.3 | A physical keyboard digit (`6`) does the same. |
| 1.4 | Moves to step 2 on its own. The key, pop and chime sounds fire, and the number is spoken ("3 puppies!"). |
| 1.5 | `0` is refused on step 1 with a gentle hint: "Pick a number from 1 to 9!" |
| 1.6 | Extra taps or keys while the animals are hopping in are ignored. The number stays the first one pressed. |
| 1.7 | A held-down key (auto-repeat) doesn't flood the input. |
| 1.8 | Tapping an animal makes it pop. |

**Manual**

- [ ] Each number key plays its own **different musical note**.
- [ ] Animals **hop in one by one** with soft bubble pops, then a bright **chime** plays before step 2.
- [ ] Speech says the number and animal ("Five kittens!"), if your device supports speech.
- [ ] Keys push down visibly when pressed, and a quick sloppy toddler tap still registers.
- [ ] Mash several keys at once with a flat hand. Only one number is taken.
- [ ] Try 1, 4 (a 2×2 square) and 9 (a 3×3 grid). The groups look neat and even.

---

## Stage 2: Pick the second number

**Automated** (`tests/02-second-number.spec.js`)

| # | Test |
|---|------|
| 2.1 | Equation reads `3 + ? =`, the `?` is active, and the big `+` sits between group 1 and group 2. |
| 2.2 | Entering 2 draws 2 animals in the second group, and group 1 still has its 3. Moves to step 3 with the prompt "How many altogether? Count them and type the answer!" |
| 2.3 | `0` is allowed and shows a "zero — none!" bubble instead of animals. |
| 2.4 | A physical keyboard digit works. |
| 2.5 | Back (⬅️) on step 2 returns to step 1 and clears group 1. |
| 2.6 | Both groups use the same animal. |
| 2.7 | Animals are the **same size** in both groups (e.g. 4 in a square next to 3 in a row). |

**Manual**

- [ ] The prompt "Now pick another number to add!" is spoken after the first number.
- [ ] The second group is pink, the first is blue, and the two numbers in the equation use the same colours.
- [ ] 9 + 9: all 18 animals fit on a phone without scrolling.

---

## Stage 3: Count and solve

**Automated** (`tests/03-answer.spec.js`)

| # | Test |
|---|------|
| 3.1 | Answer slot shows `?`, the "Count with me!" button (bottom row of the number pad) becomes active, and step dot 3 is active. |
| 3.2 | Tapping animals marks them with yellow badges 1, 2, 3… in tap order. Tapping one again pops it but doesn't count it twice. |
| 3.3 | Counting every animal shows "You counted them all!" without giving away the sum. |
| 3.4 | A correct single-digit answer is checked automatically. The slot turns green and the celebration starts. |
| 3.5 | A wrong answer shakes the equation and shows the "Oops, try counting them again!" prompt with the soft boop. The input then clears, the animals **stay**, and the game stays on step 3. |
| 3.6 | A wrong answer clears the counting badges so the child can count again. |
| 3.7 | A two-digit answer (9 + 9 = 18) waits after the "1" and then accepts the "8". |
| 3.8 | ✅ / Enter checks early. For 7 + 5, typing "1" then Enter counts as a wrong try. |
| 3.9 | Backspace deletes a digit. Backspace on an empty answer goes back to step 2. |
| 3.10 | A whole round can be played with only the physical keyboard. |
| 3.11 | "Count with me!" taps every animal in order (badges 1–5). |
| 3.12 | **Every** sum is accepted: `a + 0`, `a + (9 − a)` and `a + 9` for a = 1…9, covering sums 1–18. |

**Manual**

- [ ] Each tap on an animal makes a bubble pop that rises in pitch as the count goes up, and the number is spoken.
- [ ] The wrong-answer boop is **soft and friendly**, not a buzzer. The shake is gentle, and the animals wiggle afterwards to invite a recount.
- [ ] After 2 wrong tries, the "Count with me!" button pulses and the prompt suggests tapping each animal.
- [ ] "Count with me!" keeps pace with the speech and doesn't skip or talk over numbers.
- [ ] A toddler (or you, pretending to be one) can count all 18 animals by touch on a phone.

---

## Stage 4: Celebration and replay

**Automated** (`tests/04-celebration.spec.js`)

| # | Test |
|---|------|
| 4.1 | The card reads exactly "Hooray! 🌟 3 + 2 = 5! You did it!" with a Play Again button, and the matching sentence is spoken. |
| 4.2 | The fanfare, applause, rocket whistles and firework booms all fire. |
| 4.3 | The canvas draws more than 50 particles and visible pixels, and all particles fade away to 0. |
| 4.4 | Play Again resets to a clean step 1: no animals, no particles, card hidden. |
| 4.5 | Enter on the celebration screen plays again. |
| 4.6 | Digits are ignored while celebrating. |
| 4.7 | The game resets on its own after `config.autoResetMs`. |

**Manual**

- [ ] Rockets **launch upward**, burst into coloured sparkles that **fall with gravity and fade**, and confetti flutters down.
- [ ] Applause sounds like a crowd (claps plus "woo!" swoops). The fanfare plays on top and nothing distorts or clips.
- [ ] Animation stays smooth (no stutter) on an older iPad or phone.
- [ ] The progress bar under Play Again empties over 9 seconds, and then the game resets.
- [ ] With **Reduce Motion** turned on in the OS, there are fewer particles and no looping bounces.

---

## Take Away (subtraction)

Same three steps: **start with** a number (1–9), pick **how many go away** (0 up to the starting number), then **how many are left?** All the animals stay in one group. The ones that leave hop up, fade to grey and get a soft pink ✖.

**Automated** (`tests/07-subtraction.spec.js`)

| # | Test |
|---|------|
| T.1 | Starts with "Pick how many to start with!", a `−` sign, the title "Take Away!" and a single group (no second group or big +). |
| T.2 | Picking 7 shows 7 animals, then asks "How many go away? Pick a number to take away!" |
| T.3 | Taking away 3 of 7 marks exactly the **last 3** as gone. The boxes read `7 − 3 = ?`, the prompt asks "How many are left?", and the goodbye sound plays. |
| T.4 | You can't take away more than you have: after starting with 4, keys 5–9 are dimmed, and pressing 6 is refused with "We only have 4 …! Pick 4 or less." |
| T.5 | A correct answer shows "Hooray! 🌟 7 − 3 = 4! You did it!" and speaks "7 take away 3 equals 4". |
| T.6 | A wrong answer gets the gentle oops, and the crossed-out animals stay crossed out. |
| T.7 | Taking away everything works: 5 − 5 = 0. |
| T.8 | Taking away zero works: nobody leaves, 6 − 0 = 6. |
| T.9 | Tapping a gone animal doesn't count it. Tapping the ones that are left counts 1, 2, 3 and then says "You counted them all". |
| T.10 | "Count with me!" skips the gone animals. |
| T.11 | Back (⬅️) from step 3 brings the animals back. |
| T.12 | Every question is accepted: `a − 0`, `a − ⌊a/2⌋` and `a − a` for a = 1…9. |

**Manual**

- [ ] The leaving animals hop away **one after another**, each with a soft falling "whoop", then fade and get crossed out. It should look like "going away", not like a mistake.
- [ ] 9 − 4 on a phone: all 9 animals fit in rows of 5 (like a ten-frame), and the gone ones are still clearly visible but faded.
- [ ] A toddler understands they should count only the ones still there. If not, note what confuses them.
- [ ] Say it out loud: the speech uses "take away" (e.g. "8 take away 3. How many are left?").

---

## Surprise me! (random questions, both games)

The bottom row of the number pad shows **🎲 Surprise me!** while you're picking numbers, and **👆 Count with me!** on step 3. Surprise me makes up the whole question on step 1. On step 2 it reads **Pick for me!** and makes up only the second number. The keyboard shortcut is `R`.

**Automated** (`tests/08-surprise.spec.js`, run for both Add Along and Take Away)

| # | Test |
|---|------|
| S.1 | On step 1, Surprise me! fills in both numbers, shows the animals (added or crossed out) and goes to step 3. The button then gives way to "Count with me!", and the question can be solved to a celebration. |
| S.2 | On step 2 it reads "Pick for me!", keeps the first number and picks a valid second one (never more than the start in Take Away). |
| S.3 | Pressing `R` on the keyboard makes a surprise question. |
| S.4 | Over 500 generated questions, all are in range. Add Along: 1–9 + 1–9. Take Away: start 2–9, take away 1…start, so the answer is never negative. There is plenty of variety (more than 20 different questions). |
| S.5 | Pressing it while animals are still appearing is ignored. |

**Manual**

- [ ] Press Surprise me! ten times in a row (playing each round). The questions feel varied and never repeat back-to-back.
- [ ] Speech says "Surprise! 4 puppies!" and then carries on through the question naturally, without cutting itself off.
- [ ] The 🎁 (animal picker) and 🎲 (surprise question) buttons are easy to tell apart.

---

## Difficulty levels (both games)

Pick a level on the welcome screen (the strip of 1–10 under the game cards) or in a game with the ⭐ button (it shows the current level). The choice is remembered. Changing it mid-round starts a fresh round.

| Level | Numbers | Example |
|---|---|---|
| 1 | Both under 5 | 2 + 3 · 4 − 1 |
| 2 | One under 5, one single digit | 4 + 7 · 8 − 3 |
| 3 | Two single digits (**default**, the original game) | 8 + 6 · 9 − 6 |
| 4 | 2-digit with ones under 5, and a single digit, **no carrying** (no borrowing in Take Away) | 23 + 5 · 34 − 2 |
| 5 | 2-digit and a single digit | 47 + 8 · 52 − 7 |
| 6 | Two 2-digit numbers | 35 + 48 · 84 − 37 |
| 7 | 3-digit and 2-digit | 256 + 73 · 512 − 86 |
| 8 | Two 3-digit numbers | 418 + 365 · 734 − 258 |
| 9 | 4-digit and 3-digit | 2407 + 586 · 3021 − 475 |
| 10 | Two 4-digit numbers | 4825 + 3197 · 8204 − 3576 |

How the levels behave:
- **Surprise me!** follows these rules exactly. In Take Away the bigger number always comes first, so the answer is never negative.
- **Typing your own numbers is limited only by the number of digits.** Level 1 still allows 6 + 7 but not 11 + 3. (Take Away also can't take away more than you have.)
  - Levels 1–3 take one digit per number: the key goes straight in.
  - From level 4, a number can have up to 2, 3 or 4 digits (depending on the level). It goes in when ✅ / Enter is pressed, or automatically once the maximum number of digits is typed. ⬅️ deletes a digit. Typed questions may carry, e.g. 38 + 7 at level 4.
- **Level 4 never carries:** in Add Along, the ones digit plus the single digit is at most 9 (23 + 5, never 24 + 8). In Take Away, the single digit is never more than the ones digit (34 − 2, never 31 − 4). "Pick for me!" keeps to this for a typed first number too.
- **Levels 4–10 show only the number sentence, drawn larger.** There are no animal pictures and no "Count with me!" helper. The prompts say "What does it add up to? Type the answer!" / "How many are left? Type the answer!", and a wrong answer gets "Oops, not quite! Try again!". The bottom row of the pad keeps 🎲 Surprise me!, greyed out on the answer step.

**Automated** (`tests/09-levels.spec.js`)

| # | Test |
|---|------|
| L.1 | The welcome screen shows level chips 1–10 with level 3 selected, and a description line. |
| L.2 | A level picked on the welcome screen carries into the game (⭐ badge) and is remembered after a reload. |
| L.3 | The in-game ⭐ opens the level sheet (10 options with examples). Picking one closes the sheet and restarts the round at that level. |
| L.4 | Take Away's level sheet shows − examples, and Escape closes the sheet. |
| L.5 | **Generator:** 400 questions per level, in each game, all match that level's rules, including level 4's no-carry/no-borrow rule. In Take Away the first number is always ≥ the second. For the mixed levels (2, 4, 5, 7, 9) in Add Along, the smaller-shaped number appears in both positions. |
| L.6 | Level 1 still allows any single digits: no keys are dimmed, and 6 + 7 = 13 plays through. |
| L.6b | Level 1 doesn't allow 2-digit numbers: pressing 1 enters 1 straight away (so no 11). |
| L.6c | Level 4 lets you type a question that carries (38 + 7 = 45), but not a 3-digit number (typing 1, 2, 3 enters 12). |
| L.6d | Level 4 "Pick for me!" after typing 63 picks a second number that doesn't carry (≤ 6 in Add Along) or borrow (≤ 3 in Take Away). |
| L.7 | Level 5: typing "4","7" enters 47 automatically, and a 1-digit second number goes in with ✅. 47 + 8 = 55 celebrates. |
| L.8 | Level 9: Backspace edits a number being typed. 586 goes in with Enter, and 2407 + 586 = 2993 is accepted. |
| L.9 | A multi-digit number can't start with 0. |
| L.10 | Take Away level 6 shows a − sign. 45 − 67 is refused ("We only have 45"), and 45 − 28 = 17 celebrates. |
| L.11 | Level 6 has no animals, no picture area and no "Count with me!". Surprise me! stays greyed out in the bottom row. The prompt reads "What does it add up to? Type the answer!", a wrong answer shows "Oops, not quite! Try again!", and 35 + 48 = 83 celebrates. Level 3 still has animals and "Count with me!". |
| L.12 | Surprise me! at levels 4, 8 and 10 in both games makes a question that can be solved to a celebration. |
| L.13 | Level 10 (8204 − 3576) fits on 360×640, 667×375 and 1024×768 screens: no horizontal scroll, the equation is fully on screen, and all keys are at least 64 px and visible. Screenshots are saved. |

**Manual**

- [ ] Try each level with Surprise me! a few times in both games. The numbers should feel right for the level.
- [ ] Level 4+: the big number sentence is easy to read on a phone, including 4-digit numbers.
- [ ] Typing a 3-digit number on a phone: the digits appear in the box as you type, and ✅ lights up once there's something to enter.
- [ ] Switching level from the ⭐ sheet mid-round starts cleanly (no leftover animals). Going from level 4+ back to level 3 brings the animals and "Count with me!" back.

---

## Count Quickly (timed counting)

1 to 9 things (the current animal) are scattered over the play area. Type how many with the keypad or the keyboard: one key press is the answer. A thin bar along the very bottom of the screen counts down. The ⭐ score and the current timer length (⏱) are shown small at the top.

| Event | What happens |
|---|---|
| **Right answer** | Applause + chime + a little confetti, score +1. The **timer gets 0.5 s shorter** (never below 0.5 s), and a **new number** of things appears (never the same number twice in a row). |
| **Wrong answer** | A soft sad "wah-wah-wah-waaah" and the field shakes. The timer gets **0.5 s longer** (never above 10 s). The **same things stay**, and the bar restarts from full. |
| **Time runs out** | Treated like a wrong answer: "Time's up! Try again!", sad sound, +0.5 s, same things, bar restarts. |

The timer starts at 10 s. Keys pressed during the short pause after an answer are ignored. The clock pauses while the animal picker is open or the app is in the background, and stops when you go 🏠 home. The difficulty levels don't apply to this game.

**Automated** (`tests/10-count-quickly.spec.js`)

| # | Test |
|---|------|
| C.1 | The welcome card opens the game (`#counting`): 1–9 things, a "?" box, "⏱ 10s" and "⭐ 0". |
| C.2 | The timer bar sits in the bottom 5% of the screen, is at most 5% tall, and gets shorter over time. |
| C.3 | The things are inside the play area and don't overlap. |
| C.4 | Right answer: box turns green, applause plays, score 1, timer 9.5 s ("⏱ 9.5s"), then a new, different number of things and a fresh "?". |
| C.5 | The on-screen keypad works as well as the keyboard. |
| C.6 | Wrong answer (after two right ones, at 9 s): sad sound, the same number stays, timer 9.5 s, and the bar restarts from full. After more misses the timer is capped at 10 s. |
| C.7 | Time running out (0.8 s timer): "Time's up! Try again!", sad sound, same number, timer 1.3 s. |
| C.8 | The timer shrinks to a minimum of 0.5 s (1 s → 0.5 s → 0.5 s). |
| C.9 | Keys pressed during the pause after an answer are ignored. |
| C.10 | Six right answers in a row never repeat the previous number. |
| C.11 | Going 🏠 Home stops the clock (no time's-up sound afterwards). |
| C.12 | The 🎁 animal picker pauses the clock, swaps the things to the new animal (🐸), and the clock resumes on close. |
| C.13 | Fits 360×640, 667×375 and 1024×768 screens: 9 keys each at least 64 px and on screen, a usable play area, no horizontal scroll. Screenshots are saved. |

**Manual**

- [ ] The bar is subtle (you notice it without it being stressful). It turns orange in the last quarter.
- [ ] The sad sound is soft and a bit funny, not scary. Check it with a toddler.
- [ ] After several right answers the timer gets really short (down to 0.5 s). Check that missing a few brings it back up.
- [ ] Switch to another app or tab mid-count and come back: the bar continues from where it was.
- [ ] Things look randomly scattered and never overlap, for every number 1–9.

---

## Cross-cutting: layout, themes, sound

**Automated** (`tests/05-ui.spec.js`)

| # | Test |
|---|------|
| 5.1–5.6 | Six screen sizes, each with 9 + 9 on screen: small phone (360×640), phone portrait (375×667), phone landscape (667×375), tablet portrait (768×1024), tablet landscape (1024×768) and laptop (1440×900). Checks: all 12 keys are **at least 64×64 px**, there is no horizontal scroll, and the keypad, equation and both groups are fully on screen. All 18 animals must be at least 30 px wide and sit **inside their own group card**, and "Count with me!" must be a full-width row (at least 52 px tall) below the last key, inside the pad. A screenshot is saved to `test-results/screens/`. |
| 5.7 | The theme picker switches the animals (e.g. to 🦆) and remembers the choice after a reload. |
| 5.8 | The "Surprise!" theme picks different animals across rounds. |
| 5.9 | The sound toggle (🔇) silences every synthesized sound. |
| 5.10 | The restart button (🔄) starts over mid-round. |

**Manual**

- [ ] Rotate an iPad or phone mid-round. The layout switches between keypad-below and keypad-beside with nothing cut off.
- [ ] iPhone with a notch or home bar: nothing sits under the notch or home indicator.
- [ ] Sound off stays off after a reload, and speech stops too.
- [ ] Check contrast in bright light: the numbers stay readable on every coloured key.
- [ ] Screen reader (VoiceOver/TalkBack): keys read as "1"… "Back", "Check", and the prompt is announced when it changes.
