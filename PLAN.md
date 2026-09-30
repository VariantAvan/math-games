# Skill Mix: plan

## The idea

The child doesn't choose a game. Each question comes from a random skill (never the same skill twice in a row), and every skill starts at the easiest level. Later, each skill's own record (tries, right answers, time) moves it up or down, so the mix stays just hard enough for every skill separately.

## Status notes

- **Voice doesn't work on the iPad it was tried on**, so the game must work silently. Every game has a 2–3 word description in its intro and name tag.
- **Letters** changed from "match the same letter" to **"First letter"**: see a picture, pick the letter it starts with.
- **Taking away is paused** (out of the rotation) until it's reworked.

## Rules for "no reading needed"

1. **Voice first.** Every question is spoken, and 🔊 in the same spot always repeats it.
2. **Each skill has a look and a sound.** Every skill has its own mascot, background colour, icon and jingle, shown in a short intro. The child knows what is being asked from what they see and hear.
3. **One layout.** The question sits at the top (with a ❓ where the answer goes) and big answer cards sit at the bottom. Tapping is always how you answer.
4. **Show, don't tell.** A 👆 hand demonstrates the first time a skill appears, and again after a quiet spell.
5. **Matching before naming.** Recognition starts as "find the same one", and naming comes at higher levels.
6. **The same symbols everywhere.** ➕ means joining, ➖ means leaving, ⚖️ means comparing, ❓ means the answer goes here.
7. **Mistakes help.** A wrong card fades and, once only the answer is left (or after 2 misses), the right one glows. Every question ends in success.
8. **Progress without numbers.** A sticker row fills up, and 5 stickers bring a party.
9. **Grown-ups are hidden.** Press and hold ⚙️ for settings and records.

## Difficulty ladders

Each step changes **one thing**: more choices, a bigger range, look-alike distractors, a dropped crutch (dots, ghost letters), or tapping → typing. ✅ = built.

| Skill | L1 ✅ | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| Numbers 🦉 | Find 1–3, 2 choices, dots under numerals and in the question | 3 choices, 1–5, no dots | 4 choices, 0–9 | Look-alikes (6/9, 1/7, 2/5) | Teens (12 vs 21), 10–20 |
| First letter 🐝 | Picture → pick its first letter, 2 capitals (A B D F M P S T, no look-alike pairs) | 3 capitals, more letters | 4 capitals, A–Z | Look-alike capitals (B/P, E/F, M/N) | Lowercase letters |
| Counting 🐿️ | 1–3 in a row, 2 choices with dots | 1–5, 3 choices | 1–10 in dice / ten-frame patterns, keypad | 1–10 scattered | Timed, or up to 20 in ten-frames |
| Starts with… 🦜 | Letter + sound, pick 1 of 2 pictures (A B D F M P S T) | 3 pictures, more letters | Reverse: picture → pick its letter | Similar sounds (B/P, M/N, S/Z) | "Tap all that start with S" |
| Adding 🐻 | Sums up to 3, 2 choices | Up to 5, 3 choices | Up to 10, keypad | Up to 18 | Multi-digit (like the earlier Add Along levels 4–10) |
| Taking away 🐰 (paused) | From up to 3, 2 choices | From up to 5, 3 choices | From up to 10, keypad | Up to 18 − 9 | Multi-digit |
| Word jumble 🐙 | 3 letters, ghost letters, 10 words | Only the first ghost letter | No ghosts | 4-letter words (FISH, FROG) | 5 letters or a decoy tile |
| More or fewer 🐘 | "More", clearly different (1 vs 4) | Close numbers (3 vs 5), plus "fewer" | Numerals, no pictures | Three groups: "the most" | >, <, = |
| What comes next 🐛 | AB colours, 2 choices | AB animals, 3 choices | AAB / ABB | ABC | Number patterns (2, 4, 6, ❓) |
| Shapes 🦊 | Match the same shape, 2 choices | Voice only: "Find the triangle" | Colour + shape: "the blue square" | More shapes (oval, hexagon, diamond) | Count the sides |

## New skill areas at higher levels

Beyond harder versions of the ten skills, new areas unlock as the child levels up. Candidates, easiest first (to be chosen together):

| Area | Level 1 idea |
|---|---|
| Big and small | "Which is bigger?" (two sizes of the same animal) |
| Colours by name | "Find blue!" (colour names, not matching) |
| Opposites | Hot / cold, up / down pictures |
| Rhyming | "Which one rhymes with cat?" (🎩 or 🐶) |
| Memory match | Flip two cards to find a pair (4 cards) |
| Odd one out | 3 fruits and 1 car: tap the one that doesn't belong |
| Where is it? | "Find the cat **under** the table" (positions) |
| Sight words | "the", "and", "I" (much later) |
| Skip counting | 2, 4, 6… (much later) |
| Telling time | Hour hands only (much later) |

## Automatic levelling (next iteration)

Each skill already records `{ level, tries, correct, firstTry, totalMs }` on the device. Proposed rules, to be tuned:

- **Level up** after 3 right-first-time in a row, each within about 8 seconds.
- **Level down** after 2 wrong-first-time in a row. Never below 1.
- **Pick weaker skills a bit more often.** Weight each skill by how rarely it has been right first time recently, but keep the no-repeat rule.
- **Unlock a new skill area** once most skills are at level 3 or above.

## Iterations

1. ✅ The question shell, and level 1 of all ten skills.
2. Levels 2–3 for each skill, plus setting levels by hand in the grown-ups sheet.
3. Automatic levelling from the record, then levels 4–5.
4. New skill areas.
