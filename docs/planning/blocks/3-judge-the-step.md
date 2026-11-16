---
project: merel
type: block
status: shipped
updated: 2026-11-16
shipped_on: 2026-11-16
---
# Block 3: Judge the step

**In brief.** Merel 0.3.0: Merel is mild for real. Merel judges the step, not the note: going the right way by about the right amount counts, a wrong note resets nothing, and only a long silence starts you again from do. And a card has two buttons, Listen and Sing, with no steps that run by themselves. Two pitches, one branch, one pull request at the end.

## Framing

0.2.0 went out and was tried by someone who does not sing. It was still too frustrating (Luk, 2026-11-16): each note had to land within a semitone of where the scale says, and a wrong note sent you back to do. Beginners squeeze and stretch steps and drift, so they were sent back again and again. This block makes Merel judge what a beginner learns first, the shape of the melody ([[017-judge-the-step]]), before the later levels. After 3.1 Luk found the round itself too much like an exam: Merel sang, sang along, then you had to sing at once. A card now has Listen and Sing ([[018-listen-and-sing]]).

Read first: [[017-judge-the-step]], [[018-listen-and-sing]], [[016-movable-do]], [[014-your-turn-earns-the-dot]], [[architecture/0010-overview#Voice evaluation|voice evaluation]], [[0020-features]].

## Slots

| # | Pitch | Status | What Luk can try at the end |
|---|---|---|---|
| 3.1 | [[3-1-judge-the-step\|Judge the step]] | shipped | Squeeze or stretch the steps and they still count; a wrong note says "Not quite" and keeps your notes |
| 3.2 | [[3-2-listen-and-sing\|Listen and Sing]] | shipped | Two buttons on a card: Listen as often as you like, Sing when you are ready; completed cards stay open |

## Definition of done

Items marked *(after release)* become true only after Luk merges, bumps and tags; `finish-block` leaves them open.

- [x] A note counts when you move from the note found last the right way, from half the step to well past it, in any octave; the numbers live in the judge's config object.
- [x] A wrong note held says something mild, keeps the notes found, and you try the step again; after two, Merel offers Listen, and after it you sing from do.
- [x] A long silence (3 s) starts the try again from do.
- [x] A singing card has Listen and Sing, a switch; recognition has Listen; no step runs by itself; completed cards stay open, and levels open as before.
- [x] Without a microphone, Sing off earns the dot.
- [x] `npm run tune`: all 11 takes behave as they should under the new rule.
- [x] Unit tests and the browser check pass, with a fake microphone that sings a wrong note; the build has no errors or warnings; CI is green on the pull request.
- [x] Every page in `docs/` is true for what was built.
- [ ] *(after release)* `v0.3.0` is live on singwithmerel.com with its GitHub release.

## Test scenario

Luk runs this on the candidate at https://next.singwithmerel.com, after merging and `cz bump --prerelease rc`. About fifteen minutes, with headphones.

1. On a laptop, exercise 1. Press Listen: Merel sings the scale, nothing counts. Press Listen again while he sings: he stops.
2. Press Sing: Merel asks to listen, in one sentence; allow it, and the browser asks. Sing the scale from a do of your own, a little carelessly: steps a bit small or a bit large. Each note fills; the dot fills, Merel bows, and Sing turns off.
3. Sing again. Sing do, re, then go back down to do and hold it: "Not quite. Try mi again."; do and re stay filled. Sing mi from re and go on: the round completes.
4. Sing again. Sing do, re, mi, then stop for a few seconds: "Almost. Sing it again from do."; the notes empty. Sing the scale: it completes.
5. Sing again, and hold two wrong notes: Listen is offered. Press it: Merel sings, and after it the notes are empty and you sing from do.
6. Exercise 2, the scale down, letting your voice sink a little. It completes.
7. Exercise 3, one round: Listen, then Sing the three notes back, a step and a leap told apart. After the dot, Listen sings a new melody.
8. Go back to exercise 1 once it is done or skipped: the card is not grey, and Listen and Sing work.
9. Exercise 4: Listen starts the questions; there is no Sing.
10. In a private window, exercise 1, Sing, then Not now: Merel says once he will not listen. Sing on your own and press Sing again: a dot.
11. On your phone, steps 1 to 3.
12. Hand the phone to the person who found 0.2.0 too hard. Let them do exercise 1. (A person judges: do they get through? Is it mild enough now?)

## Later

*(Things that turn up during the block and wait for a later one.)*

- Merel sings in C only; a voice that finds C too low or too high sings in its own key, but hears Merel in another (from block 2).
- Android Chrome, tried by a person (from block 2).

## What actually happened

Merel 0.3.0 is mild for real. Merel judges the step from the note found last, not the note: the right way, from half the step to well past it, in any octave ([[017-judge-the-step]]); a wrong note says "Not quite" and keeps what you found, and only 3 s of silence, or Listen while you sing, starts again from do. After 3.1, Luk found the round itself too much like an exam, so 3.2 replaced its three steps with two buttons on each card, Listen and Sing, a switch ([[018-listen-and-sing]]); completed cards stay open, and without a microphone, turning Sing off earns the dot. All 11 tuning takes behave as they should. The machine steps of the scenario pass (105 unit tests, the browser check, a build without warnings); the person's steps, the phone, Android Chrome and the person who found 0.2.0 too hard, come on the candidate. Nothing new moved to *Later*.
