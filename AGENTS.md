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

*(Written by pitch 1.1 when the project exists: dev, check, build, voice, deploy.)*

## Layout

*(Written by pitch 1.1; the intended shape is in `docs/architecture/0010-overview.md`.)*
