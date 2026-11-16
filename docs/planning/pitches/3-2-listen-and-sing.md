---
project: merel
type: pitch
status: shipped
started: 2026-11-16
shipped_on: 2026-11-16
block: 3-judge-the-step
created: 2026-11-16
---
# 3.2 Listen and Sing

**In brief.** A singing card has two buttons: Listen, Merel singing as often as you like, and Sing, a switch for your turn. No steps run by themselves; completed cards stay open. Recognition starts from Listen.

## Problem

A round ran three steps by itself: Merel sang, sang again with you, then you had to sing alone at once, and be judged. It felt like being examined, and Start, Again, Next round, Stop and Hear it made five buttons for one idea (Luk, 2026-11-16).

## Sketch

**Two buttons** ([[018-listen-and-sing]]). Listen plays the card's melody as a `preview` round, which counts for nothing; pressed while he sings, he stops. Sing is a switch (`aria-pressed`, a small light, filled while on): on starts a `turn` round, asking for the microphone the first time; the last note found completes it, and it turns off after Merel bows. Without a microphone, Sing off (`finished`) completes it. Listen while Sing is on sings the melody and you start from do after it (`again`, from 3.1). The `hear` and `along` phases go for singing; `startRound`, Next round and Stop go.

**Melodies.** The scales stay; exercise 3 keeps its melody until it is sung, then draws a new one.

**Recognition** has Listen only: it starts a round, sings it again during one, and after the round starts the next.

**Cards.** Completed cards are no longer greyed out: you can always listen or sing. Upcoming cards' buttons stay closed. The next level opens as before, at five dots or Skip this level.

**Strings** in EN, FR, NL: Sing, Listen, the turn without a microphone, the note when Merel will not listen, exercise 1's text, the headphones tip and the privacy page.

## Cut line

Listen and Sing on the singing cards, with the round counting as described. Completed cards open, and recognition from Listen, are above it.

## Out of scope

- Merel singing along while you sing.
- Changing how levels open.

## Risks

- **Without a microphone the dot is on your word.** As before, after Sing along; accepted.

## Definition of done

- [x] Listen and Sing, a switch, on every singing card; recognition has Listen only; no Start, Again, Next round or Stop.
- [x] With Merel listening, the last note earns the dot and Sing turns off; without, Sing off earns it.
- [x] Completed cards stay open; upcoming ones stay closed.
- [x] The docs this pitch made wrong are true again: features, overview, DESIGN (poses), decisions 007 and 014 point at 018.
- [x] Every machine-runnable step of the test scenario passes.

## Test scenario

1. `npm run check` and `npm run test:e2e`: all pass.
2. `npm run dev`, exercise 1: press Listen; Merel sings, nothing counts. Press it again while he sings: he stops.
3. Press Sing: the light comes on, Merel listens. Sing the scale: each note fills, the dot fills, Merel bows, Sing turns off.
4. Sing on, then Listen: Merel sings, and you sing from do after.
5. Exercise 1 done or skipped: its card is still open; Listen and Sing work there, and no dot is added.
6. Exercise 4: Listen starts the questions.
7. In a private window, Sing, then Not now: sing on your own, press Sing again: a dot.

---

## What actually happened

Everything landed, the cut line and above it. The round has no `along` phase; a singing round starts in `turn`, and Listen is the `preview` round it was already. Routine choices: Listen is filled on the active card while nothing runs, and again after two wrong notes or misses; the note that Merel will not listen shows when you say no or the microphone fails, not each time Sing comes on; the headphones tip no longer says to sing along. The browser check takes 16 s for the listening round instead of 41, since nothing plays before your turn.
