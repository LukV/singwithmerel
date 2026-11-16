---
project: merel
type: block
status: in-cycle
updated: 2026-11-16
---
# Block 3: Judge the step

**In brief.** Merel 0.3.0: Merel is mild for real. Your turn judges the step, not the note: going the right way by about the right amount counts, a wrong note resets nothing, and only a long silence starts you again from do. One pitch, one branch, one pull request at the end.

## Framing

0.2.0 went out and was tried by someone who does not sing. It was still too frustrating (Luk, 2026-11-16): each note had to land within a semitone of where the scale says, and a wrong note sent you back to do. Beginners squeeze and stretch steps and drift, so they were sent back again and again. This block makes Merel judge what a beginner learns first, the shape of the melody ([[017-judge-the-step]]), before the later levels.

Read first: [[017-judge-the-step]], [[016-movable-do]], [[014-your-turn-earns-the-dot]], [[architecture/0010-overview#Voice evaluation|voice evaluation]], [[0020-features]].

## Slots

| # | Pitch | Status | What Luk can try at the end |
|---|---|---|---|
| 3.1 | [[3-1-judge-the-step\|Judge the step]] | shipped | Squeeze or stretch the steps and they still count; a wrong note says "Not quite" and keeps your notes |

## Definition of done

Items marked *(after release)* become true only after Luk merges, bumps and tags; `finish-block` leaves them open.

- [ ] A note counts when you move from the note found last the right way, from half the step to well past it, in any octave; the numbers live in the judge's config object.
- [ ] A wrong note held says something mild, keeps the notes found, and you try the step again; after two, Merel offers Hear it, and after Hear it you sing from do.
- [ ] A long silence (3 s) starts the try again from do.
- [ ] `npm run tune`: all 11 takes behave as they should under the new rule.
- [ ] Unit tests and the browser check pass, with a fake microphone that sings a wrong note; the build has no errors or warnings; CI is green on the pull request.
- [ ] Every page in `docs/` is true for what was built.
- [ ] *(after release)* `v0.3.0` is live on singwithmerel.com with its GitHub release.

## Test scenario

Luk runs this on the candidate at https://next.singwithmerel.com, after merging and `cz bump --prerelease rc`. About fifteen minutes, with headphones for Sing along.

1. On a laptop, exercise 1. At Your turn, sing the scale from a do of your own, a little carelessly: steps a bit small or a bit large. Each note fills; the round completes.
2. Next round. Sing do, re, then go back down to do and hold it. Merel says "Not quite. Try mi again."; do and re stay filled. Sing mi from re and go on: the round completes.
3. Next round. Sing do, re, mi, then stop for a few seconds. Merel says "Almost. Sing it again from do."; the notes empty. Sing the scale: it completes.
4. Hold two wrong notes. Merel offers Hear it; press it. After it, the notes are empty and you sing from do.
5. Exercise 2, the scale down, letting your voice sink a little. It completes.
6. Exercise 3, one round: the three notes fill as you sing them back, a step and a leap told apart.
7. On your phone, steps 1 and 2.
8. Hand the phone to the person who found 0.2.0 too hard. Let them do exercise 1. (A person judges: do they get through? Is it mild enough now?)

## Later

*(Things that turn up during the block and wait for a later one.)*

- Merel sings in C only; a voice that finds C too low or too high sings in its own key, but hears Merel in another (from block 2).
- Android Chrome, tried by a person (from block 2).
