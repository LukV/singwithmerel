---
project: merel
type: pitch
status: in-cycle
started: 2026-11-15
block: 2-your-turn
created: 2026-11-14
---
# 2.2 The mild judge

**In brief.** Your turn judges each note, mildly: in any octave, within a semitone, held for 0.3 s, in order. Each note fills in its colour as you find it; a miss keeps what you found and you sing again from there. The numbers are tuned on a child, a woman and a man. At the end Merel 0.2.0 is ready for its candidate.

## Problem

After 2.1, any steady tone counts: you can sing the wrong note and still get the dot. And nothing on the staff tells you which notes you have found.

## Sketch

**The judge** (`src/listen/judge.ts`, pure, tested). It takes the pitch track and the melody and returns which notes are found. Each sung pitch is folded to a pitch class and compared with the next note not yet found: within the tolerance and held for the hold time, that note is found and the judge moves to the next. Notes in order; rhythm and timing not judged; a wrong note simply does not count. The numbers live in one config object: tolerance 100 cents, hold 0.3 s, and the level gate and silence time from 2.1, to be tuned. It replaces the steady-tone rule behind the same function.

**Notes fill as you find them.** During Your turn the staff's notes start outlined; each fills in its colour when found, with the next one outlined, as recognition's trail does. Merel nods at each, softly.

**A miss.** When you stop singing (silence for about 1.5 s) or sing on past the melody before all notes are found: Merel says something mild ("Almost. Sing it again from mi."), the found notes stay filled, and Your turn starts again from the first note not yet found. After two such tries the card offers Hear it. Tries are unlimited; the round never resets; Skip this level stays. All found: Merel bows, the dot fills, Next round.

**Tuning.** `npm run tune` (from 2.1) gets the judge: for each recording in `tuning/` it prints the notes found and the moment each was found. The in-tune takes of the child, the woman and the man must find every note; the off-key take must not find its wrong note. The chosen numbers and the results go in *What actually happened* and in the config object's comments.

**Strings** in EN, FR, NL: the mild messages, naming the note to sing from in each language's note names.

**Tests.** Unit: the judge on synthetic tracks (in tune, an octave off, a semitone off, a wrong note, a pause, a slide through the note that should not count before the hold). Browser check: the fake microphone with a scale that misses one note, then the full scale; the found notes stay.

## Cut line

The judge with the found notes filling and a mild retry. The offer of Hear it after two tries and Merel's nod are above the line.

## Out of scope

- Rhythm, timing, a score of any kind, or how far off you were.
- Changing the numbers per level or per voice.
- Exercise 4 and Sing along, as in 2.1.

## Risks

- **Mild enough?** One semitone and 0.3 s are guesses until people who do not sing try them; the test scenario hands the phone to one.
- **Octave errors** of the detector (a child's voice read an octave low) do not matter once pitches are folded, but a fifth error would; check on the recordings.
- **Slides.** Someone sliding up from do to mi passes re; the hold time keeps re from counting if it is out of turn, and in order it does no harm.

## Definition of done

- [ ] The judge folds octaves, allows a semitone, needs 0.3 s, and goes in order; the numbers are in one config object.
- [ ] Notes fill as they are found; a miss keeps them and starts again from the first not found; after two tries Hear it is offered.
- [ ] Tuned on the three voices: every note of the in-tune takes found, not the wrong note of the off-key take; results noted.
- [ ] The docs this pitch made wrong are true again: features (one round), overview (voice evaluation), decision 005 if the numbers changed.
- [ ] Every machine-runnable step of the test scenario passes.

## Test scenario

1. `npm run check` and `npm run test:e2e`: all pass, including the judged round with a missed note.
2. `npm run tune`: every in-tune take finds all its notes; the off-key take misses its wrong note.
3. `npm run dev`, exercise 1, Your turn: sing the scale; each note fills as you hold it, then Merel bows and the dot fills.
4. Next round, sing re instead of mi and stop: do and re stay filled, Merel says to sing again from mi; sing on correctly and the round completes.
5. Miss twice: Hear it is offered; nothing resets.
6. Sing an octave lower: it counts.
7. Exercise 3, one round: the three notes fill as you sing them back.
8. On the iPhone: steps 3 and 4. (A person judges: is it mild enough?)

---

## What actually happened

*(At the end: one paragraph on what landed, what was cut, what surprised us.)*
