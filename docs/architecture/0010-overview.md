---
project: merel
type: architecture
status: draft
updated: 2026-11-14
---
# Overview

**In brief.** Merel is a static, installable web app (a PWA): HTML, CSS, JavaScript, fonts and audio clips, served over HTTPS at singwithmerel.com ([[010-hosting]]). Everything runs in the browser: the melody generator, the clip player, the pitch detector and the progress store. There is no server, no database and no third-party call at runtime. The stack is [[012-stack]].

## Stack

| Part | Choice | Why |
|---|---|---|
| Build | Vite + TypeScript | static output, fast, what Claude Code knows well |
| UI | Preact with signals | small bundle on a phone; Merel and the staff are SVG |
| Install, offline | a service worker via vite-plugin-pwa | caches the app and all clips |
| Audio out | Web Audio API, one AudioContext | sample-accurate scheduling of clips |
| Audio in | getUserMedia + an AudioWorklet | microphone frames off the main thread |
| Pitch | a small open-source detector (candidate: pitchy, McLeod method) | no AI, runs on the device |
| Hosting | S3 and CloudFront behind Route 53 ([[010-hosting]], proposed) | the domain is already in Route 53 |
| CI and deploy | GitHub Actions: checks on every push; a release tag deploys through OIDC, candidates to next.singwithmerel.com | no keys in GitHub; only a tag goes live |
| Versions | semantic versioning, Conventional Commits, commitizen ([[011-versions-and-releases]]) | a changelog and real releases |

## Modules

```
src/
  melody/     # the random three-note melody and the scale exercises; pure functions, tested
  audio/      # loads and schedules Merel's clips; interface sounds
  listen/     # microphone, pitch detection, the mild judge
  progress/   # local storage, the progress code, levels and dots
  i18n/       # EN, FR, NL strings and note names
  ui/         # lesson (path, cards), instrument (staff, keys), Merel (SVG poses, CSS motion)
public/
  voice/      # Merel's clips, see docs/reference/0010-voice-clips.md
```

## One round in code

1. The lesson asks `melody` for the round's notes: a fixed scale, or a random shape.
2. **Hear it:** `audio` schedules the named clips (or "du" in recognition) a beat apart; the staff highlights each note as it sounds; Merel sings.
3. **Sing along:** the same playback; in release 1 the round completes when it ends.
4. **Your turn:** `listen` opens the microphone (permission asked here the first time), runs the detector on each frame, and passes pitches to the judge.
5. The judge returns, per note, matched or not; the round completes when every note matched.
6. `progress` fills a dot; at five dots it opens the next level and Merel bows.

## Voice evaluation

The judge is deliberately mild:

- **Octave folded.** Each pitch becomes a pitch class before comparing, so a bass and a child both sing do.
- **Tolerance.** Within one semitone (100 cents) of the target.
- **Hold.** A note matches when it stays inside the tolerance for 0.3 s; a steady tone close by gets the benefit of the doubt.
- **Order, not timing.** Notes must come in order; the rhythm is not judged yet.
- **Sing-along is never judged**: Merel's voice reaches the microphone too. Headphones solve it; the app suggests them.

The numbers live in one config object, so they can be tuned without touching code.

| Release | A round completes when | Fallback |
|---|---|---|
| 1 | you sang along to the end | none needed |
| 2 | Your turn produced a steady tone per note | release 1 rule |
| 3 | Your turn matched every note, mildly | release 1 rule |

Microphone refused, missing or too noisy: the app falls back to the release 1 rule and says so once.

## Progress

Stored under one local-storage key, `merel.v1`:

```json
{
  "version": 1,
  "lang": "nl",
  "levels": { "1": { "dots": 5, "done": true }, "2": { "dots": 2 } },
  "skipped": [],
  "updated": "2026-11-14T08:00:00Z"
}
```

Safari deletes a site's stored data after about seven days without a visit unless the app was installed to the home screen. So the app invites installing after the first completed level, and offers a short progress code (the JSON above, compressed and base64url-encoded) to copy and paste back.

## Device notes

- Audio starts only after a tap: Start creates and resumes the AudioContext.
- The silent switch on an iPhone can mute web audio; the first screen says so in one line.
- Bluetooth headphones add delay: fine for listening and judging, sing-along may feel slightly late.
- Eight keys on a 390 px phone are about 43 px each, at the limit for touch; test early.

## Privacy

The microphone is asked for only at the first Your turn, with one sentence on why. Frames are analysed in memory and discarded at once. No analytics, no cookies, fonts self-hosted, no request to any host but our own.
