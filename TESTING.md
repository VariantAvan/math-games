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

## Stage 1: Pick the first number

**Automated** (`tests/01-first-number.spec.js`)

| # | Test |
|---|------|
| 1.1 | Loads on step 1: prompt reads "Pick the first number!", first slot shows a pulsing `?`, no animals, step dot 1 is active. |
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

**Manual**

- [ ] The prompt "Now pick another number to add!" is spoken after the first number.
- [ ] The second group is pink, the first is blue, and the two numbers in the equation use the same colours.
- [ ] 9 + 9: all 18 animals fit on a phone without scrolling.

---

## Stage 3: Count and solve

**Automated** (`tests/03-answer.spec.js`)

| # | Test |
|---|------|
| 3.1 | Answer slot shows `?`, the "Count with me!" button appears, and step dot 3 is active. |
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

## Cross-cutting: layout, themes, sound

**Automated** (`tests/05-ui.spec.js`)

| # | Test |
|---|------|
| 5.1–5.6 | Six screen sizes, each with 9 + 9 on screen: small phone (360×640), phone portrait (375×667), phone landscape (667×375), tablet portrait (768×1024), tablet landscape (1024×768) and laptop (1440×900). Checks: all 12 keys are **at least 64×64 px**, there is no horizontal scroll, and the keypad, equation and both groups are fully on screen. All 18 animals must be at least 30 px wide and sit **inside their own group card**, and the groups must not cover the "Count with me!" button. A screenshot is saved to `test-results/screens/`. |
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
