---
project: merel
type: pitch
status: ready
block: 1-sing-along
created: 2026-11-14
---
# 1.2 Rounds, melodies and progress

**In brief.** The four exercises become playable: rounds of Hear it, Sing along and Your turn, the random three-note melody, recognition in two steps, dots that fill, levels that open, and progress that survives a reload and moves by a code. Merel sings from his clips when they are in `public/voice/`, and from a plain tone when they are not. At the end Luk can work through all four levels.

## Problem

After 1.1 the screen is there but nothing happens in it: the cards cannot be played and nothing is remembered.

## Sketch

**Melodies** (`src/melody/`, pure functions, tested). Exercise 1 and 2 are the scale up and down. Exercise 3 and 4 draw a random shape (up-up, down-down, up then below the start) and a start note so the shape fits C4 to C5, from do major, never the same melody twice in a row. Rhythm: one 4/4 bar, quarter, quarter, half. Steps are a free choice among scale notes in the right direction; leaps stay within the octave.

**Rounds** (`src/ui/` and a small round state machine). Hear it plays the notes a beat apart while the staff marks each one and Merel sings. Sing along plays them again; when it ends, the round is complete and a dot fills (release 1 rule, [[architecture/0010-overview#Voice evaluation|the overview]]). Your turn is offered after it as practice: Merel listens, the staff shows the notes, the user presses "next". Recognition (exercise 4): Merel sings on "du"; the user answers up or down per step; then finds the three notes on the keys; notes appear on the staff as they are found; a wrong answer shows the chosen note in its colour and lets the user try again. The round completes when all three notes are found.

**Merel's voice** (`src/audio/`). Loads `public/voice/<syllable>-<pitch>.m4a` per [[0010-voice-clips]]: named set for exercises 1 to 3 (ti instead of si in English), du set for exercise 4. A clip that is missing falls back to a plain tone at that pitch, so the app works before any clip exists. Clips are scheduled on the audio clock, a beat at 90 per minute.

**Progress** (`src/progress/`). The `merel.v1` record of the overview in local storage. Five dots complete a level and open the next; "skip this level" opens the next without filling. The completed level turns quiet, the next becomes active and the feed scrolls to it. A progress code: the record compressed and base64url-encoded, with copy and paste in a small panel.

**Merel's poses follow the round**: singing during Hear it and Sing along, listening in Your turn and recognition, thinking between the two recognition steps, bowing when a round completes, waiting otherwise.

## Cut line

Exercises 1 and 2 playable to five dots with a tone, the next level opening, and progress kept across a reload. Exercises 3 and 4, the clips and the progress code above the line, expected.

## Out of scope

- The build step that checks and converts clips: 1.3.
- The microphone, and any judging of the voice: block 2.
- Levels beyond the four.

## Risks

- **Timing on phones.** Scheduling clips and staff marks together on a slow phone; use the audio clock, not timers.
- **Clips not ready.** The fallback tone keeps the pitch moving; check that switching between clip and tone mid-round does not jar.
- **Recognition in two steps** is new; it was not in the mockup. Keep it to two big buttons and the keys.

## Definition of done

- [ ] `src/melody/` generates only the three shapes, inside the range, never twice the same in a row; unit tests prove it over a thousand draws.
- [ ] All four exercises run their rounds as [[0020-features]] describes.
- [ ] Dots, levels, skip and the quiet completed state work; the feed scrolls to the next level.
- [ ] Progress survives a reload; the progress code restores it in a cleared browser.
- [ ] Clips play when present, the tone when not; English uses ti.
- [ ] Merel's pose follows the round.
- [ ] Playwright: one full round of exercise 1 fills a dot; a reload keeps it.
- [ ] `docs/product/0020-features.md` and the overview match what was built.

## Test scenario

1. `npm run check`: passes, with the melody tests among them.
2. `npm run dev`. Press Start, then Start on exercise 1. Merel sings the scale up while the staff marks each note; then Sing along; a dot fills and Merel bows.
3. Do four more rounds. The fifth dot opens exercise 2: exercise 1 turns grey, the feed scrolls, exercise 2 is active.
4. Press "skip this level". Exercise 3 opens.
5. Play five rounds of exercise 3. Each melody is three notes, up-up, down-down or up then below the start, shown in a 4/4 bar; no two in a row are the same. (A person judges whether they sound right.)
6. Play exercise 4: Merel sings on "du". Answer up or down, then find the notes on the keys. Choose a wrong key once: it shows in its colour and you can try again.
7. Reload. Everything is where it was.
8. Open the progress panel, copy the code. In the browser, clear the site's data, reload, paste it back. Your progress returns.
9. Switch to English and do a round of exercise 1: the seventh note is "ti" if the clips are in place, a tone if not.
10. Put one clip in `public/voice/` (any `do-C4.m4a`) and reload: that note is sung, the others are tones.

---

## What actually happened

*(At the end.)*
