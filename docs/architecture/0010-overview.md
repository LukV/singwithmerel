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
| Install, offline | a web app manifest and a small service worker written by the build (`build/service-worker.ts`) | keeps the app and all clips at the first visit; no plugin to follow |
| Audio out | Web Audio API, one AudioContext | sample-accurate scheduling of clips |
| Audio in | getUserMedia + an AudioWorklet | microphone frames off the main thread |
| Pitch | a small open-source detector (candidate: pitchy, McLeod method) | no AI, runs on the device |
| Hosting | S3 (eu-north-1) and CloudFront behind Route 53 ([[010-hosting]]); the setup is in `deploy/README.md` | the domain is already in Route 53 |
| CI and deploy | GitHub Actions: checks on every push; a release tag deploys through OIDC, candidates to next.singwithmerel.com | no keys in GitHub; only a tag goes live |
| Versions | semantic versioning, Conventional Commits, commitizen ([[011-versions-and-releases]]) | a changelog and real releases |

## Modules

```
src/
  main.tsx, app.tsx  # entry point; the split screen, the keyboard
  state.ts    # the app's signals: language, started, the note played, progress
  melody/     # the do major scale, the scale exercises, the random three-note melody; pure functions, tested
  audio/      # the AudioContext, the plain tone, Merel's clips scheduled on the audio clock
  round/      # one round as a small state machine (round.ts), and the controller that plays it
  listen/     # block 2: microphone, pitch detection, the mild judge
  progress/   # the merel.v1 record in local storage, levels and dots, the progress code
  i18n/       # languages and paths; EN, FR, NL strings and note names, one file each
  ui/         # identity, lesson (path, cards), instrument (staff, keys), Merel (SVG poses, CSS motion)
  styles/     # the tokens of DESIGN.md as custom properties, and the layout
  offline.ts  # registers the service worker
  install.ts  # the install prompt, and whether Merel runs from the home screen
build/        # Vite plugins: a static page per language, the service worker; design SVGs cleaned on import
public/       # the icons, the manifest, robots.txt; voice/ holds Merel's clips and their list, voice.json
voice/        # the clips' WAV sources, never published; npm run voice checks and converts them; make/ is how they are made
scripts/      # npm run voice: reads WAV, measures pitch (YIN), converts to AAC
deploy/       # the one-time AWS setup, the upload, the CloudFront path function and response headers
```

**Pages and languages.** The build writes `/en/`, `/fr/` and `/nl/` as static pages, each with its `lang`, title and description, the privacy and about page in each (`/en/privacy/`), and a `/` that runs the same app. On load the app picks the language (the path, then the stored choice, then the browser), stores it in `merel.v1` and moves to its path; the switch in the header does the same without a reload, and stays on the page it is on.

**Offline.** After the build, `build/service-worker.ts` writes `dist/sw.js` with the list of every file (pages, script, style, woff2 fonts, icons, the clips) and a version made from their contents. At the first visit the worker keeps them all. Pages come from the network when there is one, so the next start shows a new release, and from the kept copy when there is none; everything else comes from the kept copy first. A new build is a new cache, fetched in the background, which then replaces the old one. The app asks for an update each time it comes back into view.

**Serving.** CloudFront serves a private S3 bucket per site, with a small function on every request (`deploy/paths.js`): www moves to the bare domain, `/fr` moves to `/fr/`, and a folder serves its `index.html`. Every response carries the headers in `deploy/headers.json`: HSTS, a content security policy that allows only our own host, no framing, no referrer; next.singwithmerel.com adds `noindex`. `vite preview` sends the same headers, so the browser check runs under the same rules. Hashed files are cached for a year; everything else is checked on every visit.

**Drawings.** Merel, the wordmark and the clef are imported from `docs/design/assets/` and cleaned at build time. Hand-drawn lines (the staff, the lesson path, underlines) are drawn per size from a seeded wobble, never stretched; the staff measures its box and places everything in multiples of half a line space.

## One round in code

1. A card's Start asks `round` for a new round; it takes its notes from `melody`: a fixed scale, or a random shape, never the one before.
2. **Hear it:** `audio` loads the named clips (or "du" in recognition) and schedules them a beat apart at 90 per minute on the audio clock; a clip that is missing or does not decode is a plain tone at its pitch. The controller follows the audio clock frame by frame, so the staff marks the note that sounds; Merel sings.
3. **Sing along:** the same playback, a beat later; in release 1 the round completes when it ends, and Your turn follows as practice. In recognition, the answers move the state machine instead, and the round completes when the third note is found.
4. **Your turn:** `listen` opens the microphone (permission asked here the first time), runs the detector on each frame, and passes pitches to the judge.
5. The judge returns, per note, matched or not; the round completes when every note matched.
6. `progress` fills a dot and saves the record; at five dots the level is done, Merel bows, the next level opens and the lesson scrolls to it.

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

Safari deletes a site's stored data after about seven days without a visit unless the app was installed to the home screen. So the app invites installing after the first completed level, once, where it can be done (Safari on an iPhone or iPad, or a browser that offers to install), and offers a short progress code to copy and paste back: the levels and skipped levels of the record above, compressed with deflate-raw and base64url-encoded, behind `m1.` (or `m0.` uncompressed, for a browser without compression). A damaged code is turned down with a message; it never touches the progress.

## Device notes

- Audio starts only after a tap: Start creates and resumes the AudioContext.
- The silent switch on an iPhone can mute web audio; on an iPhone the first screen says so in one line, and every phone gets a line about headphones.
- Bluetooth headphones add delay: fine for listening and judging, sing-along may feel slightly late.
- Eight keys on a 390 px phone are about 43 px each, at the limit for touch; test early.

## Privacy

The microphone is asked for only at the first Your turn, with one sentence on why. Frames are analysed in memory and discarded at once. No analytics, no cookies, fonts self-hosted, no request to any host but our own; the content security policy enforces it. CloudFront keeps no access logs. The privacy and about page says the same to the user.
