---
project: merel
type: context
status: living
updated: 2026-11-14
---
# Merel: start here

**In brief.** Merel is a free, open-source web app (Apache 2.0, [LukV/singwithmerel](https://github.com/LukV/singwithmerel)) that teaches anyone to sing a scale and to recognise notes by ear, with solfege. Merel is a geometric blackbird in a bow tie who sings each note by its name; you sing along, then alone, and he listens. It runs in English, French and Dutch at singwithmerel.com, as a static installable web app with no accounts and no server. These docs are where Luk, Claude (chat) and Claude Code work together: product and design are settled here before code changes, and code follows what is written here.

## What lives where

| Folder | For whom | What it holds |
|---|---|---|
| `product/` | Luk, a partner, anyone new | [[0010-vision]]: what Merel is and the rules behind every trade-off; [[0020-features]]: exercises, rounds, dots, levels, languages |
| `design/` | whoever touches what the user sees | [[DESIGN]]: the look, the tokens, Merel's poses; `assets/`: Merel, the wordmark and the signs as SVG; `mockup/`: the canvas sources |
| `architecture/` | Claude Code, an engineer | [[architecture/0010-overview\|0010-overview]]: the parts of the app and how a round runs in code; `decisions/`: the numbered decisions, one file each |
| `reference/` | whoever produces or checks an asset | [[0010-voice-clips]]: the spec for Merel's recorded notes and where to drop them |
| `planning/` | Luk, Claude, Claude Code | [[planning/_about\|how we work]]: blocks and pitches; `blocks/` and `pitches/` hold the work |

## Assets outside this folder

The visual work lives as artifacts on claude.ai, private to Luk until shared. Link to them; do not copy them in.

- [Merel style guide canvas](https://claude.ai/artifact/5seqHFaDNWxYoyJ2sa95wY): page "Style guide" holds the chosen identity, typography and colour, Merel's five poses and the split-screen mockup; page "Earlier rounds" holds what was tried and dropped.
- [Merel: product requirements](https://claude.ai/artifact/Afo6jNzrQBF28K3jy9ZZfE): the first write-up of the requirements, 14 November 2026. This folder supersedes it.

Merel's voice clips go in the code tree, not in `docs/`: see [[0010-voice-clips]]. The SVG sources of the canvas are copied into `design/assets/` and `design/mockup/`, because Claude Code cannot open the canvas.

## How we write here

In brief first: a reader who stops after it is right. One paragraph per line, no hard wraps, no em dashes. Plain and warm, first person plural, present tense. English throughout; what the user sees is written per language in the app, not here. Decisions carry the date and the person, one file each in `architecture/decisions/`. Open questions are listed as open in [[planning/_about|the plan]], never answered by implication. Docs describe Merel as it is now; history lives in git and in `planning/`. In a folder, pages are numbered in steps of ten from `0010`, and an `_about.md` says what the folder holds.
