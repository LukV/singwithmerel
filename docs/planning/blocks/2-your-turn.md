---
project: merel
type: block
status: in-cycle
updated: 2026-11-15
---
# Block 2: Your turn

**In brief.** Merel 0.2.0: Merel listens. In Your turn you sing alone, a soft dot on the staff follows your voice, and each note fills in its colour once you hold it close enough. The dot for the round comes from Your turn now, not from Sing along. Judging is mild: any octave, a semitone either way, notes you found stay found, and you try again as often as you like. Without a microphone Merel works as in 0.1.0. Two pitches, one branch, one pull request at the end.

## Framing

Block 1 made Merel sing; this block makes him listen, which is what turns practice into learning: you hear yourself land on the note. Decision 005 planned two stages, first a steady tone per note, then a match per note; both ship together in 0.2.0, because a steady tone alone tells a learner little (Luk, 2026-11-14). Pitch 2.1 brings the microphone, the pitch detector and the voice dot, and lets a steady tone per note complete the round, so Luk can try listening early. Pitch 2.2 replaces that with the mild judge and tunes it on real voices.

Read first: [[0020-features]], [[architecture/0010-overview#Voice evaluation|voice evaluation]], [[005-evaluation]], [[014-your-turn-earns-the-dot]], [[DESIGN]].

## Before the first pitch

- **Recordings for tuning** (Luk). Three voices: a child, a woman, a man. Each sings, on a phone's voice recorder, one take per line: the scale up (do re mi fa sol la si do), the scale down, the three-note melody `do mi sol`, and one take sung deliberately a little off and with a wrong note. Any format the phone makes (m4a is fine). Name them `<voice>-<take>.m4a`, for example `child-up.m4a`, `man-offkey.m4a`, and put them in `tuning/` at the top of the repository. That folder is never committed: the recordings are for tuning only, unless the singers agree to share them. Pitch 2.1 can start without them on Merel's own clips; 2.2 needs them.
- **Branch.** `block/2-your-turn`, cut from `main` after 0.1.0.

## Slots

| # | Pitch | Status | What Luk can try at the end |
|---|---|---|---|
| 2.1 | [[2-1-microphone-and-voice-dot\|The microphone and the voice dot]] | shipped | Your turn asks for the microphone once, a dot follows your voice on the staff, a steady tone per note completes the round; refusing the microphone keeps 0.1.0 |
| 2.2 | [[2-2-the-mild-judge\|The mild judge]] | in-cycle | Each note fills when you hold it; a miss keeps what you found and you sing again; tuned on a child, a woman and a man |

2.1 comes first; 2.2 builds on its detector and its listening Your turn.

## Definition of done

Items marked *(after release)* become true only after Luk merges, bumps and tags; `finish-block` leaves them open.

- [ ] Your turn asks for the microphone once, with one sentence on why, before the browser's own question.
- [ ] Refused, missing or failing microphone: the round completes after Sing along as in 0.1.0, the app says so once, and Merel can be asked to listen again later.
- [ ] While you sing alone, a soft dot follows your voice on the staff, folded into the staff's octave, in no note's colour.
- [ ] A note fills in its colour when you hold it within a semitone, in any octave, long enough (0.3 s planned; 0.2 s once tuned on the recordings), in order. The numbers live in one config object.
- [ ] A miss keeps the notes found, says something mild, and starts Your turn again from the first note not yet found; after two tries Merel offers Hear it. Nothing resets a round, and Skip this level stays.
- [ ] Sing along is never judged; the microphone is open only during Your turn, and audio is analysed in memory only.
- [ ] Recognition (exercise 4) works as in 0.1.0.
- [ ] The judge, tuned on the three recorded voices, finds every note of their in-tune takes and not the wrong note of the off-key take; the numbers are in the pitch notes.
- [ ] Works on iPhone Safari, Android Chrome and a desktop browser, installed and in the browser.
- [ ] Unit tests and the browser check pass, with a fake microphone; the build has no errors or warnings; CI is green on the pull request.
- [ ] Every page in `docs/` is true for what was built.
- [ ] *(after release)* `v0.2.0` is live on singwithmerel.com with its GitHub release.

## Test scenario

Luk runs this on the candidate at https://next.singwithmerel.com, after merging and `cz bump --prerelease rc`. About twenty minutes, with headphones for Sing along.

1. On a laptop, start exercise 1 and let Hear it and Sing along play. At Your turn, Merel asks to listen, in one sentence. Allow it; the browser asks for the microphone.
2. Sing the scale alone. A soft dot follows your voice on the staff, and each note fills in its colour as you hold it. When the last one fills, Merel bows and a dot fills on the card.
3. Next round. This time sing re instead of mi, on purpose. Do and re fill, mi waits. Stop singing: Merel says something mild, do and re stay filled, and Your turn starts again from mi. Sing it right: the round completes.
4. Miss twice. Merel offers Hear it; press it, then sing again. Nothing resets.
5. Sing the scale an octave lower (or higher) than written. It counts.
6. Do one round of exercise 3. The three notes fill as you sing them back.
7. Do one round of exercise 4. It works as before; Merel does not ask for the microphone.
8. In a private window, start exercise 1 and refuse the microphone. Merel says once that he will not listen, and the round completes after Sing along, as in 0.1.0. Ask him to listen again from the card: the browser asks again.
9. On your phone, with the app installed, do steps 1 to 3. (A person judges: does the dot feel calm, not jittery?)
10. Hand the phone to someone who does not sing. Let them do exercise 1. (A person judges: is it mild enough? Did they get stuck?)

## Later

*(Things that turn up during the block and wait for a later one.)*
