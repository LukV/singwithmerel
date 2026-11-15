---
project: merel
type: pitch
status: shipped
started: 2026-11-15
shipped_on: 2026-11-15
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

- [x] The judge folds octaves, allows a semitone, needs 0.3 s (0.2 s once tuned), and goes in order; the numbers are in one config object.
- [x] Notes fill as they are found; a miss keeps them and starts again from the first not found; after two tries Hear it is offered.
- [x] Tuned on the three voices: every note of the in-tune takes found, not the wrong note of the off-key take; results noted.
- [x] The docs this pitch made wrong are true again: features (one round), overview (voice evaluation), decision 005 if the numbers changed.
- [x] Every machine-runnable step of the test scenario passes.

## Test scenario

1. `npm run check` and `npm run test:e2e`: all pass, including the judged round with a missed note.
2. `npm run tune`: every in-tune take finds all its notes; the off-key take misses its wrong note.
3. `npm run dev`, exercise 1, Your turn: sing the scale; each note fills as you hold it, then Merel bows and the dot fills.
4. Next round, sing re instead of mi and hold it: do and re fill, then Merel says to sing again from do and the notes empty; sing the whole scale right and the round completes.
5. Miss twice: Hear it is offered; nothing resets.
6. Sing an octave lower: it counts.
7. Exercise 3, one round: the three notes fill as you sing them back.
8. On the iPhone: steps 3 and 4. (A person judges: is it mild enough?)

---

## What actually happened

Everything landed, the cut line and above it: the judge (`src/listen/judge.ts`, replacing the steady-tone rule of 2.1 and `ear.ts`), the notes outlined on the staff and filling as found, a mild miss that names where to sing from and keeps what was found, Hear it offered as the filled button after two tries, and Merel's soft nod at each note. The recordings were the surprise. They are untrained and were sung without hearing Merel first, so nobody sang in C: the child in about A♭ and G, the woman in F♯, the man in E and D. Luk chose to keep Merel's C for the judge (2026-11-15), so `npm run tune` now measures and labels each take before anything is tuned (each note matched to the one meant, the key of the take, how far off each note is in that key; `npm run tune -- --label` writes `tuning/labels.json`), then moves the take into Merel's key and judges it. The labels show what the singers did: the scales mostly within 50 cents of their own key, a few steps a quarter tone or more off, the man's scale down stretched by about 170 cents with its first note 117 cents sharp, and the woman's and the child's do mi sol coming back down instead of up to sol. Tuning on them changed two numbers: the hold is 0.2 s, not 0.3 (some notes last only 0.25 s), counted as time close to the note in all, and the gap is 0.15 s, not 0.08 (scoops and wobbles broke the man's notes). Tolerance stays under 100 cents. With those, all 11 takes behave as their labels say: every note of the six in-tune scales and the man's do mi sol, the woman's and the child's do mi sol stop at their wrong sol, the man's scale down stops at its sharp first note, and neither off-key take completes. Routine choices: a next note counts only once you move nearer to it than to the note just found (one tone between mi and fa is not both, and high do then low do needs a pause); a miss is 1.5 s of silence after singing, or as many steady tones that found nothing as notes were left; while Merel sings Hear it or a key rings, the try starts afresh; the browser check's fake microphone now sings the scale with re instead of mi twice, then the scale from mi, so every run sees a miss before the round completes. The off-key takes' melodies are not known, so they are judged as the scale up and down from their first note; there is no woman off-key take. Two loose ends from the plain-Node unit tests are fixed on the way: `listening.ts` and `store.ts` no longer touch Node's warning `localStorage`. Whether 0.2 s and a semitone feel mild is the person's step of the scenario. Luk's first try on a laptop found the notes very hard to reach: the level gate of 0.01 came from the recordings, which a phone's automatic gain made loud (around 0.05), while the browser opens the microphone raw. Turned 3 to 7 times quieter, the takes lost most of their notes at 0.01, so the gate is 0.002; YIN still calls a frame without a clear pitch silence, and all 11 takes behave as before. After that try Luk changed the miss (2026-11-15): off key, you start again from do, as is usual, instead of keeping the notes found. A try now ends at the first steady tone held 0.2 s that finds nothing, not after as many as notes were left, or at 1.5 s of silence; the notes empty and the card says to sing again from do. All 11 takes still behave as their labels say, with no miss in any in-tune scale; the fake microphone sings do, re and a held sol where mi should be, then the whole scale. Then Luk found he had to choose between a C too low and a C too high to reach sol, and chose that do is where you start ([[016-movable-do]], 2026-11-15). The judge takes a try's first pitch held 0.2 s, wobbling less than 60 cents, as do; held on, the note keeps setting the key, and each note found moves the key to the average of where the notes were sung, so do follows a little drift. The voice dot follows your do. `npm run tune` now judges each take as sung and measures each note from the first one; a note under 120 cents off may count or not, since the judge measures it on its own frames. All 11 takes behave as they should. Measured from its flat first do, the man's scale up now has a wrong fa, a whole tone above mi, and stops there; Merel's C had let it through. Luk then found the scale down very hard: a glide from high do down the semitone to si stayed within 60 cents of the last frames all the way, so do moved down with the voice and si was never found. Once found, the first note now keeps setting do only while you are nearer to it than to the next note; a test sings the scale down legato, and all 11 takes still behave as they should.
