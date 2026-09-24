# Add Along! 🐾: Toddler Math

Cheerful, **100% offline** math games for toddlers: addition (sums up to 18) and take-away subtraction. The whole app is one file, [`index.html`](index.html). Open it in any browser, even with no internet, directly from disk (`file://`).

## How to play

The app opens on a **welcome screen** where you pick an activity: **Add Along** (addition) or **Take Away** (subtraction). **Count Up** (counting) is a placeholder marked "Coming soon!". The 🏠 button in the game goes back to the welcome screen, and `index.html#addition` / `index.html#subtraction` open a game directly.

In both games, **🎲 Surprise me!** at the bottom of the number pad makes up a random question instead of asking for the two numbers (on step 2 it reads **Pick for me!** and picks only the second number). Keyboard shortcut: `R`.

**Add Along:**

1. **Pick the first number** (1–9). That many animals hop onto the screen.
2. **Pick another number** (0–9). A second group joins, with a big **+** between them.
3. **How many altogether?** Tap each animal (or press **👆 Count with me!** at the bottom of the number pad) to count it (it pops and gets a number badge), then type the answer. A correct answer gets fireworks, confetti, a fanfare and applause. A wrong answer gets a gentle wobble and "Oops, try counting them again!"

**Take Away:**

1. **Pick how many to start with** (1–9).
2. **Pick how many go away** (0 up to the starting number). They hop away, fade and get a soft ✖.
3. **How many are left?** Count the animals that are still there and type the answer.

**Controls:** the on-screen keypad (0–9, ⬅️ back, ✅ check) or the physical keyboard (`0`–`9`, `Enter`, `Backspace`).
**Top bar:** 🏠 back to the game list · 🎁 pick the animal (puppies, kittens, chicks, bunnies, frogs, horses, ducks, birds, apples, stars, or a surprise each round) · 🔊 sound on/off · 🔄 start over.

## How it's built

- **No external anything.** No frameworks, CDNs, fonts, images or audio files. Visuals use Unicode emoji and CSS.
- **Sound** is synthesized with the Web Audio API: a pentatonic note per key, bubble pops, chimes, a soft "uh-oh" boop, a brass fanfare, and crowd applause made from filtered white-noise claps plus swooping "woo" voices.
- **Speech** uses the browser's built-in `speechSynthesis`. If the browser doesn't have it, the game is simply silent.
- **Fireworks and confetti** come from a small HTML5 canvas particle system with gravity, drag, fade and additive glow. It respects `prefers-reduced-motion`.
- **Toddler-proofing:** no text selection, no pinch or double-tap zoom, no pull-to-refresh, no long-press menus. Taps register on touch-down, and held or mashed keys are ignored while animals are animating.
- **Responsive:** the keypad sits below the game in portrait and beside it in landscape (phone, tablet and laptop).

## Tests

See **[TESTING.md](TESTING.md)** for the automated and manual checklist for each stage.

```bash
npm install
npm test
```
