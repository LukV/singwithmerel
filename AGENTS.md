# AGENTS.md

Read this first. It is a map, not a manual: it points at the pages that hold the detail. `CLAUDE.md` only includes this file.

## What Merel is

A free web app that teaches anyone to sing a scale and recognise notes by ear, with solfege. Merel is a geometric blackbird in a bow tie who sings each note by name; you sing along, then alone. English, French and Dutch, at singwithmerel.com. A static, installable web app: no accounts, no server, nothing leaves the device.

## Read before touching anything

1. `docs/_about.md`: what lives where, and how we write.
2. `docs/planning/_about.md`: how we work, in blocks and pitches.
3. The current block in `docs/planning/blocks/` and the pitch you are on in `docs/planning/pitches/`.
4. `docs/product/0020-features.md`, `docs/design/DESIGN.md`, `docs/architecture/0010-overview.md`, `docs/architecture/decisions/`.

## How we work

- **Blocks and pitches only.** No board, no betting table, no issues. A block is a release; a pitch is a large, shaped piece of it.
- **One branch per block** (`block/<n>-<slug>`), pushed to the public GitHub repository LukV/singwithmerel (Apache 2.0); pitches are commits on it, conventional commit messages. GitHub Actions checks every push; keep it green. One pull request per block, at its end. Never merge into `main` yourself.
- **Work a whole pitch on your own.** Luk does not want to approve small steps. Make the routine choices inside the pitch's edges yourself and note them in the pitch's *What actually happened*. Ask Luk only when the work would cross the cut line or the out-of-scope list, or needs a decision recorded in `docs/architecture/decisions/`.
- **End of a pitch:** run every machine-runnable step of its test scenario, fix what fails, make the docs true, then stop and show Luk the scenario, step by step, with what he should see. Luk runs it and says go, or what to fix.
- **End of a block:** the same with the block's scenario, then open the pull request and wait for green checks.
- The skills `start-pitch`, `ship-pitch` and `finish-block` in `.claude/skills/` run these steps.

## Rules

- **Commits follow Conventional Commits** (`feat(instrument): ...`, `fix: ...`, `docs: ...`); CI runs `cz check` on them. Semantic versioning with commitizen: never run `cz bump`, never tag, never edit `CHANGELOG.md` or the version by hand. Luk releases; a tag is what deploys (`docs/architecture/decisions/011-versions-and-releases.md`).

- The docs describe Merel as it is now. A change that makes a page wrong fixes that page in the same pitch.
- A real choice (stack, hosting, a format) becomes a numbered decision in `docs/architecture/decisions/`, with date and person, and a line in that folder's `_about.md`.
- Colour belongs to a note and is the same everywhere; real notation first; colour never the only cue (`docs/design/DESIGN.md`).
- Never frustrate: mild judging, no score, nothing that resets a round, the app works without a microphone.
- No secrets in the repository or in GitHub: AWS is reached through OIDC only.
- Nothing leaves the device: no analytics, no third-party requests, fonts self-hosted, audio analysed in memory only.
- English in code and docs; what the user sees is written per language in the string files, never hard-coded.
- Docs style: "In brief" first, one paragraph per line, no em dashes, plain and warm, present tense.
- The design canvas on claude.ai is not reachable from here. Its sources are in `docs/design/assets/` and `docs/design/mockup/`.

## Commands

Node 26, pinned in `.nvmrc`. After cloning: `npm install`, and once `npx playwright install chromium` for the browser check.

| Command | Does |
|---|---|
| `npm run dev` | the app at http://localhost:5173, with the dev control (fill a dot on a level, start over); `npm run dev -- --host` to open it from a phone on the same network |
| `npm run check` | types (`tsc`), lint (ESLint) and unit tests (Vitest): what CI runs first |
| `npm test` | the unit tests only |
| `npm run test:e2e` | builds the site and runs the Playwright check against it, on a desktop and a phone viewport |
| `npm run build` | the static site in `dist/`: `/`, `/en/`, `/fr/`, `/nl/`; it must print no warning |
| `npm run preview` | serves `dist/` at http://localhost:4173, with the live site's security headers |
| `npm run voice` | checks the WAV clips in `voice/` (pitch within 10 cents) and converts them to `public/voice/*.m4a` with `voice.json` |
| `npm run piano` | downloads the Iowa piano notes C4 to C5, trims and checks them, and writes `public/piano/*.m4a` (run once; the clips are in git) |
| `npm run deploy -- next\|site` | the manual fallback: uploads `dist/` and clears CloudFront's cache; a version tag normally does this (`deploy/README.md`) |

## Layout

```
src/
  main.tsx, app.tsx   # entry point; the split screen and the keyboard
  state.ts            # the app's signals: language, started, the note played, progress
  melody/             # the do major scale, the scale exercises, the random melody; pure, tested
  audio/              # the AudioContext, the plain tone, the piano notes for the keys, Merel's clips on the audio clock
  round/              # one round as a state machine, and the controller that plays it
  progress/           # the merel.v1 record, levels and dots, the progress code
  i18n/               # languages, paths, and one string file per language (en.ts, fr.ts, nl.ts)
  ui/                 # identity, header, lesson and cards, instrument (staff, keys), Merel, hand-drawn lines
  styles/             # tokens.css (DESIGN.md tokens) and app.css
  offline.ts          # registers the service worker
  install.ts          # the install prompt; iPhone and home-screen checks
public/               # the icons (copied from docs/design/assets/icons/), the manifest, robots.txt; voice/ for Merel's clips, piano/ for the keys
voice/                # the clips' WAV sources, never published; make/ holds how they are made in Synthesizer V
scripts/              # npm run voice and npm run piano: WAV reading, pitch measuring, conversion
build/                # Vite plugins: the pages per language, the service worker, SVGs cleaned on import, preview headers
deploy/               # the one-time AWS setup, the upload, the CloudFront function and headers; README.md explains them
tests/e2e/            # the Playwright check
docs/                 # the docs; Merel and the signs are imported from docs/design/assets/
.github/workflows/    # ci.yml (every push), deploy.yml (version tags)
```

Merel, the wordmark and the clef are imported straight from `docs/design/assets/` (`?clean`), so the design sources stay the only copy.
