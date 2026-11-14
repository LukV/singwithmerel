---
project: merel
type: pitch
status: shipped
block: 1-sing-along
created: 2026-11-14
started: 2026-11-14
shipped_on: 2026-11-14
---
# 1.1 The instrument and the lesson

**In brief.** The app's whole screen, built for real: the identity screen, the lesson path with its four cards and their states, the instrument with the staff and the keys that sound, Merel in his five poses and moving, in English, French and Dutch, on a laptop and a phone. The cards do not run exercises yet; that is 1.2. At the end Luk can open it, play notes on the keys and the keyboard, switch language and resize to a phone.

## Problem

Everything exists as a canvas mockup that only renders inside claude.ai. There is no app, no repository and no build.

## Sketch

**The project.** The repository exists, with `main` tracking LukV/singwithmerel; the docs, README, `.gitignore` and `.cz.toml` are there but not yet committed. First commit them on `main` (`docs: ...`), push, then cut `block/1-sing-along`. Vite with TypeScript and Preact ([[012-stack]]). `package.json` starts at version `0.0.0`; commitizen reads and bumps it ([[011-versions-and-releases]]). Vitest for units, Playwright for one browser check. `npm run dev`, `npm test`, `npm run build`, `npm run check` (types, lint, tests) written into `AGENTS.md`.

**CI.** `.github/workflows/ci.yml` runs on every push and pull request: install with the lockfile, `npm run check`, the Playwright check in a headless browser, `npm run build`, and on pull requests `cz check` over the branch's commit messages. Node version pinned in `.nvmrc` and used by both CI and local.

**Tokens and type.** The tokens of [[DESIGN]] as CSS custom properties. Kalam Bold and Hanken Grotesk self-hosted, subset to Latin with the French accents.

**Merel.** One component that draws the pose from `docs/design/assets/merel/merel-<pose>-static.svg`, keeps its animation groups, and plays `merel-motion.css` when live. Reduced motion stops it.

**The identity screen** as on the canvas: the wordmark from `docs/design/assets/signs/wordmark.svg`, "You play. He sings.", Start, Merel singing on his ground line.

**The lesson.** The four exercise cards on a path: number nodes on a thin hand-drawn line, title, text, Merel's pose, five dots, the two buttons. Three states (active, upcoming, completed) as [[0020-features]] describes, switchable for now from a dev-only control so they can be checked.

**The instrument.** Real notation: the hand-drawn staff, the treble clef from `clef.svg`, notes placed by pitch with ledger line for low do, stems, a 4/4 bar line and final double bar. Under each note its name and, where the language uses them, its letter. Eight keys, black keys between, each with its colour dot, name, letter and keyboard key. Clicking a key or pressing A S D F G H J K plays a plain tone and shows the note's dot and the radiating dashes on the staff.

**Layout.** Desktop and landscape: lesson left, scrolling; instrument right, fixed. Phone in portrait: lesson on top, instrument docked at the bottom at about 45% of the height, staff showing four to five notes and following the current one, keys at least 44 px wide (the gutters narrow to make room), keycaps hidden. The instrument slides up when Start is pressed; under reduced motion it simply appears.

**Languages.** Paths /en, /fr, /nl, a switch in the header, the choice remembered in local storage, the first visit following the browser. Strings per language in one file each; note names per [[0020-features#Languages]].

**Mockup source.** `docs/design/mockup/App.dc.html` holds the canvas mockup's markup and round logic, for reference.

## Cut line

The identity screen and the split screen with the instrument playing tones from clicks and keys, the four cards drawn in all three states, on desktop and phone, in English. French and Dutch above the line, expected.

## Out of scope

- Running exercises, rounds, dots that fill, levels, progress: 1.2.
- Voice clips: 1.2. Install, offline, hosting: 1.3.
- The microphone: block 2.

## Risks

- **Hand-drawn lines on a fluid layout.** The canvas used fixed SVG widths; the staff and keys must stretch without the wobble looking stretched. Draw the lines per size, not scaled.
- **Phone keys.** Eight keys at about 43 px each is at the limit; check on a real phone early.
- **iOS audio.** Sound only after a tap; Start creates and resumes the audio context.

## Definition of done

- [x] Repository on `block/1-sing-along`, pushed to GitHub, with the scripts above; `npm run check` passes.
- [x] The CI workflow runs on the block branch and is green.
- [x] Decision 012 records the stack.
- [x] Every commit follows Conventional Commits; CI checks them on the pull request.
- [x] Identity screen, lesson path with four cards in three states, and the instrument match the canvas closely.
- [x] Every key plays its note by mouse, touch and keyboard, and shows its dot and the dashes on the staff.
- [x] Merel's five poses render and move; reduced motion stops them.
- [x] /en, /fr, /nl and the switch work; names and letters follow the language.
- [x] The phone layout docks the instrument at the bottom from 360 px wide.
- [x] One Playwright check opens /en, presses Start and plays sol by pressing G.
- [x] `AGENTS.md` has the real commands; `docs/architecture/0010-overview.md` matches the code layout.

## Test scenario

1. `npm install && npm run check`: types, lint and tests pass.
2. On GitHub, the Actions tab shows the CI run for the last push on `block/1-sing-along`, green.
3. `npm run dev`, open the address it prints. You see the identity screen with Merel singing and hopping.
4. Press Start. The lesson shows four numbered cards on a path, the instrument shows the do major scale on the staff and eight keys.
5. Click each key, then press A S D F G H J K. Each plays its note, its dot shows, the dashes appear at the note on the staff.
6. Switch to Français, then Nederlands. Names change (ré in French, no letters in French), the page path changes, a reload keeps the language.
7. Open the browser's device toolbar at 390 by 844 and press Start. The instrument slides up and docks at the bottom; the keys are big enough to tap. Tap the bar with the grab handle, or swipe it down: the instrument tucks away to that bar; tap or swipe up and it comes back. (A person judges.)
8. In the dev control (the small "dev" button at the bottom left, only in `npm run dev`), set card 1 to active, 2 to completed, 3 and 4 upcoming. Active is black and underlined, completed is grey with Merel bowing. (A person judges.)
9. On your phone, open the dev address on the same network (`npm run dev -- --host`). Tap Start and play a few keys; you hear them.

---

## What actually happened

The whole pitch landed, French and Dutch included. Vite, TypeScript and Preact with signals ([[012-stack]]); Merel, the wordmark and the clef are imported straight from `docs/design/assets/` and cleaned at build time, so there is one copy of each drawing. The staff is drawn per size: it measures its box and places everything in multiples of half a line space, and the staff lines, the lesson path and the underlines are seeded hand-drawn lines rather than stretched paths. On a phone the notes keep a readable spacing, about five show, and the staff scrolls to the note just played; the keys stay at least 44 px wide down to 360 px because the gutters and key gaps shrink instead (Luk, 2026-11-14), and the instrument slides up on Start, not under reduced motion. Routine choices: the build writes static `/en/`, `/fr/`, `/nl/` pages and a `/` that runs the same app and picks the language; the language is stored in the `merel.v1` record, which 1.2 extends; keys play on pointer down for less delay on phones, and the computer keyboard also plays the home row by position, so A S D F G H J K works on AZERTY too; the desktop shows the instrument from the start, as on the canvas, and Start scrolls to exercise 1; the card copy follows the docs, not the canvas (exercise 3 is a random melody, not Vader Jacob); completed dots take the colours of do to sol; the instrument's head shows the note just played with its dot. Worth knowing: the cards' Start and Hear it buttons do nothing yet, that is 1.2; the dev control appears only in `npm run dev`; CI runs `cz check` on every push to a branch as well as on pull requests, and fails the build on any warning; `npm audit` reports moderate advisories in typescript-eslint, a development tool that never reaches the site. After Luk's first run (2026-11-14): on desktop the lesson column is now as wide as the first screen needs (between 420 and 620 px) and the instrument takes the rest; Start scrolls smoothly to exercise 1 (instantly under reduced motion); the stages sit further apart on desktop; and on a phone the instrument's head is a handle that tucks it away to a slim bar and back, by tap or swipe, because Luk found himself wanting to hide and show it. Also fixed on the way: the README said a pull request deploys on merge (a tag does), DESIGN.md now allows the one slide and says the keys keep 44 px, and the block's definition of done marks the items Luk checks after the release.
