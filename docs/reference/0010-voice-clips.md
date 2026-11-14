---
project: merel
type: reference
status: draft
updated: 2026-11-14
---
# Voice clips

**In brief.** Merel sings from 17 short recorded clips: the eight notes from low do to high do sung on their names, "ti" for English, and the same eight notes sung on "du". Produce them once with an AI singing voice or a vocal synthesizer, drop them in `voice/` at the top of the repository as WAV files named as below, and run `npm run voice`: it checks them and makes them ready for the app.

## The set

| Set | Syllables | Pitches | Files |
|---|---|---|---|
| named | do re mi fa sol la si do | C4 D4 E4 F4 G4 A4 B4 C5 | 8 |
| named, English | ti | B4 | 1 |
| neutral | du on every note | C4 D4 E4 F4 G4 A4 B4 C5 | 8 |

## File names

`<syllable>-<pitch>.wav`, lower case, the pitch in scientific notation:

```
voice/
  do-C4.wav  re-D4.wav  mi-E4.wav  fa-F4.wav  sol-G4.wav  la-A4.wav  si-B4.wav  do-C5.wav
  ti-B4.wav
  du-C4.wav  du-D4.wav  du-E4.wav  du-F4.wav  du-G4.wav  du-A4.wav  du-B4.wav  du-C5.wav
```

## Each clip

- **One voice for all 17**, same timbre and loudness.
- **Pitch:** tuned to A4 = 440 Hz, within 10 cents of the target, steady, little or no vibrato.
- **Length:** about 1.2 s of sustained vowel after a clean consonant; the app trims or fades as needed.
- **Start:** sound within 20 ms of the file's start, so scheduling stays on the beat.
- **Clean:** no reverb, no music, no breath before the note; mono; peak around -3 dBFS.
- **Format:** WAV, 48 kHz, 16 or 24 bit.

## Register

The pitches above are the written pitches. A lower voice may sing everything one octave down (C3 to C4); then all 17 clips are in that octave, and `voice/manifest.json` says so:

```json
{ "octaveOffset": -1, "voice": "describe the voice or tool used" }
```

The judge folds octaves, so the user's own octave never matters; the offset only keeps the staff honest.

## Until the clips exist

The app reads `public/voice/voice.json`, the list of clips that exist, and asks only for those, at `/voice/<syllable>-<pitch>.m4a`. Any clip not listed is sung as a plain tone at its pitch, in the clips' octave, so a partial set works. With no clips the list is empty and Merel sings with the tone.

## What `npm run voice` does

1. Reads every WAV file in `voice/` and `voice/manifest.json`. The sources stay outside `public/`, so they are never published. With no WAV files it says so and stops.
2. Measures each clip's pitch over the steady middle of the sound and prints how far it is from its note, in cents. It refuses a clip more than 10 cents off, a clip with no steady pitch, and a file that is not one of the 17 names. It warns when the sound starts later than 20 ms.
3. Converts every clip that passes to AAC in `.m4a` (plays on every browser, Safari included) into `public/voice/`, with `afconvert` on a Mac or `ffmpeg` elsewhere, and writes `public/voice/voice.json`.
4. Exits with an error if any clip was refused, after listing them all, so a partial set can still be tried.

Commit the `.m4a` files and `voice.json`; the build and the service worker take them from there, and the service worker keeps them for offline use.

## Later

A wider range (planned) adds clips at the same spec, for example G3 to B3 and D5 to G5, named the same way.
