---
project: merel
type: pitch
status: shipped
started: 2026-11-16
shipped_on: 2026-11-16
block: 3-judge-the-step
created: 2026-11-16
---
# 3.1 Judge the step

**In brief.** Your turn judges each step from the note found last: the right way, by about the right amount, counts. A wrong note says "Not quite" and keeps what you found; only a long silence, or Hear it, starts you again from do. At the end Merel 0.3.0 is ready for its candidate.

## Problem

In 0.2.0 each note must land within a semitone of where the scale says it is, judged from the note before, and the first wrong note held starts the try again from do. Someone who does not sing found it too frustrating: they squeeze and stretch steps, sing a half step as a whole one, and are sent back to do again and again.

## Sketch

**The judge** (`src/listen/judge.ts`, pure, tested). The first steady note is where you start, as in 0.2.0. After it, the judge keeps where the note found last was sung (`last`, the median of its frames while you stay on it), and for the next note looks at the step: the frame's pitch minus `last`, in any octave (also ±1200 cents). It counts when it goes the step's way, from `least` (0.5) of its size to `most` (200) cents past it, or half its size past it for a leap: a whole step from 100 to 400 cents, a half step from 50 to 300, do to sol from 350 to 1050. Held 0.2 s in all, the note is found. Within `stay` (100) cents of `last`, and nearer to it than to the step, you are still on the note found last; after a pause, held 0.2 s there, you are singing it again, and the next step starts from where you sing it now. A steady tone on neither is a wrong note: an event, nothing resets. 3 s of silence is a miss: the try starts again from do. `tolerance`, `follow` and `strikes` go.

**The round and the card.** A new round event `wrong`: the notes stay, `tries` counts, and the card says "Not quite. Try mi again." (the next note). `missed` (silence) is as before: the notes empty, "Almost. Sing it again from do." After two wrong notes or misses, Hear it is offered as before; Hear it during Your turn (`again`) empties the notes and the judge starts from do. Strings in EN, FR, NL.

**The dev log** says what step it wants ("mi (100 to 400 cents up from 131.2 Hz C3)") and logs a wrong note with the last 3 s, as a miss.

**Tuning.** `npm run tune` measures each step of a take as sung and calls a step wrong when the new rule would not count it; a step within 30 cents of an edge may go either way.

**Tests.** Unit: the reach of a step; uneven scales (half steps as whole, whole as half); standing still; a wrong note that resets nothing; a long silence; Hear it. Every 0.2.0 test of drift, sinking, scoops and legato stays. Browser check: the fake microphone sings do, re, do again (a wrong note), then the rest of the scale; "Not quite" shows, the notes stay, the round completes.

## Cut line

The step judge with wrong notes that reset nothing, and the silence miss. The dev log's step and the "Not quite" message naming the next note are above the line.

## Out of scope

- A strict level, or numbers per level or per voice.
- Merel singing in another key.
- Rhythm, timing or any score.

## Risks

- **Too mild?** A scale in half steps passes. Accepted ([[017-judge-the-step]]); the voice dot still shows where you are.
- **Running a note behind.** A step sung less than half its size is not one, and the next step may stand in for it, so the judge waits for one more note. The card names the note it waits for.
- **Edges.** Exact steps of a whole tone sung as a half tone sit on an edge; floating point decides. Tests keep off the edges.

## Definition of done

- [x] A note counts when you move the right way from the note found last, from half the step to well past it, in any octave; the numbers are in the judge's config object.
- [x] A wrong note says "Not quite" and keeps the notes; a long silence and Hear it start from do; after two Hear it is offered.
- [x] `npm run tune`: all 11 takes behave as they should.
- [x] The docs this pitch made wrong are true again: features (one round), overview (voice evaluation), decisions 014 and 016 point at 017, AGENTS (tune).
- [x] Every machine-runnable step of the test scenario passes.

## Test scenario

1. `npm run check` and `npm run test:e2e`: all pass, including the judged round with a wrong note.
2. `npm run tune`: 11 of 11 as they should be.
3. `npm run dev`, exercise 1, Your turn: sing the scale with careless steps; it completes.
4. Sing do, re, then do again and hold it: "Not quite. Try mi again."; do and re stay. Go on from re: it completes.
5. Stop for 3 s halfway: "Almost. Sing it again from do."; the notes empty.
6. Two wrong notes, then Hear it: after it you sing from do.
7. On the phone, steps 3 and 4. (A person judges: is it mild enough now?)

---

## What actually happened

Everything landed, the cut line and above it. The judge keeps where the note found last was sung and counts the next when the step goes its way, from half its size to 200 cents past it (half its size past it for a leap), in any octave; `tolerance`, `follow` and `strikes` are gone, `least`, `most` and `stay` are new, and the silence is 3 s instead of 1.5. A wrong note is a round event of its own (`wrong`), the card says "Not quite. Try mi again." and the notes stay; Hear it in Your turn (`again`) starts from do. Tuning found one trap: in a legato step, a frame just short of the step was taken for the note found last sung again, and the judge re-anchored there and stuck (the man's and the child's scale up stopped at la and si). Singing the note found last again now counts only after a pause and once held 0.2 s. With that, `npm run tune` gives 11 of 11: all six scales and the man's do mi sol complete; the woman's and the child's do mi sol stop at their sol, which comes back down; the woman's scale down sings its si only 29 cents under do, so the judge runs a note behind and waits for one more do, as decision 017 says it may. Routine choices: a tie between staying on the note and the step goes to the step, except to the same note in another octave, which needs a pause; the fake microphone in the browser check sings do, re, do again, a second's thought, then the rest of the scale, since a message shown for 0.2 s is too quick for the check (and for a person). Whether it is mild enough now is the person's step of the scenario, ideally the one who found 0.2.0 too hard.
