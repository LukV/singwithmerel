---
project: merel
type: pitch
status: in-cycle
block: 2-your-turn
created: 2026-11-14
started: 2026-11-15
---
# 2.1 The microphone and the voice dot

**In brief.** Merel starts listening. At the first Your turn he asks, in one sentence, to hear you; the microphone feeds a pitch detector that runs in the browser, and a soft dot follows your voice on the staff. For now a steady tone per note completes the round; pitch 2.2 makes it a match. Refuse the microphone and Merel works as in 0.1.0.

## Problem

Your turn is practice only: Merel is silent, nothing hears you, and the round was already complete after Sing along. Nothing tells you whether you sang the note.

## Sketch

**Pitch detection in the browser.** The YIN detector from `scripts/voice/pitch.ts` moves to `src/listen/yin.ts`, pure and tested, and the voice script imports it from there. An AudioWorklet (`src/listen/pitch-worklet.ts`, loaded with `audioWorklet.addModule` from our own origin, so the content security policy holds) reads the microphone in frames of about 2048 samples, every 10 ms or so, and posts `{ hz, clarity, level }` to the page; frames are analysed in memory and dropped. The detector and its settings (frame, hop, threshold, lowest and highest pitch, about 70 Hz to 1100 Hz for a man to a child) are chosen in this pitch on Merel's 17 clips and, when they exist, the recordings in `tuning/`; the choice becomes decision 015. `npm run tune` runs the same detector over those files and prints, per take, the notes it hears.

**The microphone.** `src/listen/mic.ts` opens `getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })` into the one AudioContext, only for Your turn, and closes it after, so the browser's microphone indicator is on only while Merel listens. Before the browser's question, the card says one sentence ("Merel listens while you sing. Your voice stays on this device.") with "Let him listen" and "Not now". The answer is remembered (`merel.mic`). Refused, missing, failing or no AudioWorklet: the release 1 rule, said once on the card, with a quiet "Let Merel listen" link on the card to ask again.

**Your turn listens.** The round's `turn` phase gets a listening state. With listening on, the round completes when Your turn ends, not after Sing along. The rule for this pitch: one steady tone per note of the melody, in order (a pitch that stays within a quarter tone for 0.3 s, then a change or a pause). The rule sits behind one function, so 2.2 swaps in the judge. Merel takes his listening pose. A key pressed during Your turn mutes the listening for the length of the piano note, so the piano is not taken for your voice.

**The voice dot.** On the staff, during Your turn only, a soft dot at the height of your pitch, folded into the staff's octave (C4 to C5) and moving smoothly (a short median and easing, so it is calm, not jittery). It is paper-coloured with a faint ring on the dark instrument, never a note's colour, and it fades when you are silent. Reduced motion: it jumps instead of gliding.

**Strings** in EN, FR, NL: the ask, the two buttons, the once-only message on refusal, the link to ask again, Your turn while listening.

**Tests.** Unit: YIN on synthetic tones and on Merel's clips, the steady-tone rule on pitch tracks. Browser check: Chromium's fake microphone (`--use-fake-device-for-media-stream` with `--use-file-for-fake-audio-capture` on a generated WAV of the scale) for the listening round, and a denied permission for the fallback.

## Cut line

The microphone asked for once, the detector in a worklet, the steady-tone rule completing the round, and the fallback to 0.1.0. The voice dot and `npm run tune` are above the line.

## Out of scope

- Judging against the target note: 2.2.
- Recognition (exercise 4) listening: it stays keys and buttons.
- Judging Sing along: never, Merel's voice reaches the microphone too.
- Rhythm, recording or playing back the user's voice, any server.

## Risks

- **iPhone.** Safari's microphone in an installed app, the AudioWorklet, and the silent switch: try on a real iPhone early.
- **Merel's voice in the microphone.** Your turn follows Sing along; Merel's last note may still ring. Listening starts after a short gap.
- **Noise and a quiet voice.** A level gate below which nothing is heard; tune it on the recordings.
- **Bluetooth headsets** may switch to their own low-quality microphone; note it, do not fight it.

## Definition of done

- [ ] YIN lives in `src/listen/`, tested, shared with `npm run voice`.
- [ ] The microphone is asked for at the first Your turn, after one sentence, and is open only during Your turn.
- [ ] A steady tone per note, in order, completes the round when listening is on; otherwise the round completes after Sing along.
- [ ] Refused or missing microphone: said once, the release 1 rule, and a way to ask again.
- [ ] The voice dot follows the voice on the staff, calm, in no note's colour.
- [ ] Decision 015 records the detector and its settings, measured on Merel's clips and the recordings that exist.
- [ ] The docs this pitch made wrong are true again: features, overview, DESIGN (the voice dot), privacy page.
- [ ] Every machine-runnable step of the test scenario passes.

## Test scenario

1. `npm run check` and `npm run test:e2e`: all pass, including the fake-microphone round and the refused microphone.
2. `npm run tune`: per file in `tuning/` and for Merel's clips, the notes heard, in order.
3. `npm run dev`, exercise 1, Your turn: Merel asks in one sentence; allow it, the browser asks for the microphone.
4. Sing the scale alone: the dot follows your voice on the staff, and after the eighth steady note the round completes.
5. Hum one note and slide: the dot slides with you, calmly.
6. Press a key during Your turn: the piano does not count as your voice.
7. In a private window, refuse the microphone: Merel says so once, and the round completes after Sing along.
8. On the iPhone, with `npm run dev -- --host`: steps 3 and 4. (A person judges: is the dot calm?)

---

## What actually happened

*(At the end: one paragraph on what landed, what was cut, what surprised us.)*
