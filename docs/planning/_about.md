---
project: merel
type: planning-system
status: living
updated: 2026-11-14
---
# How we work

**In brief.** Work comes in blocks and pitches, and nothing else: no board, no betting table, no ticket per small thing. A block is a release; a pitch is a large, shaped piece of it. Claude Code builds a whole pitch on its own, then stops and shows a test scenario that Luk runs. A block ends with one pull request, which Luk merges after running the block's scenario. Luk rarely reads code in detail, so what he checks is behaviour, through the scenarios.

## Block

A release-sized programme: one note in `blocks/<n>-<slug>.md`. It holds:

- **Framing**: what the block delivers and why now.
- **Slots**: its pitches, in order, each with a status (draft, ready, in-cycle, shipped, dropped). The slot list is the only status record there is.
- **Definition of done**: a checklist that is true when the block is finished.
- **Test scenario**: numbered steps Luk runs at the end, on a laptop and on a phone, each with what he should see.

One block, one branch: `block/<n>-<slug>`, cut from `main`, pushed to the public GitHub repository LukV/singwithmerel. GitHub Actions checks every push: types, lint, unit tests, the browser check, a build. At the end of the block, one pull request into `main`; it needs green checks, and Luk merges it. Luk does not need to read the code: the checks and the scenarios are the review.

## Versions and releases

A block becomes a release through a candidate ([[011-versions-and-releases]]). After the merge, Luk runs `cz bump --prerelease rc` and pushes the tag: the candidate deploys to next.singwithmerel.com, where Luk runs the block's test scenario on a laptop and a phone. When it passes, `cz bump` and push: the release deploys to singwithmerel.com with a GitHub release and its changelog. Block 1 is 0.1.0. Every commit follows Conventional Commits; Claude Code never bumps or tags.

## Pitch

A large, shaped unit inside a block: one note in `pitches/<n>-<m>-<slug>.md`, from [[pitches/_template|the template]]. Pitches are big on purpose: each one ends in something Luk can try.

- **Problem, sketch, cut line, out of scope, risks**: as in Proef. The cut line is the smallest version still worth shipping; out of scope keeps temptations out.
- **Definition of done**: a checklist that is true when the pitch is finished, including the docs it made wrong.
- **Test scenario**: numbered steps, each a command or an action with what to see. A step only a person can judge says so and names what to look at.

A pitch is built as commits on the block branch, no branch or pull request of its own. When the pitch is done, Claude Code runs every step of the test scenario that a machine can run, fixes what fails, then **stops** and shows Luk the scenario. Luk runs it and answers "go" (the next pitch starts) or with what to fix (fixed in the same pitch).

## Scope, not time

There are no estimates and no deadlines. A pitch ends when its definition of done holds. If the work wants to grow past the cut line, that is a question for Luk, never a silent expansion; anything new becomes a slot in this block or the next.

## Small things

A typo, a colour, a wrong word: fix it inside the current pitch and say so when showing the scenario. Something larger that turns up mid-pitch goes into the block note under *Later* and waits.

## Who does what

| Who | Does |
|---|---|
| Luk | decides the blocks and their order, says go or what to fix after each pitch, merges at the end of a block, bumps the version and releases |
| Claude (chat) | shapes design and product with Luk, writes and updates blocks and pitches in these docs |
| Claude Code | shapes the technical sketch of a pitch at its start, builds it, keeps the docs true, runs and shows the test scenarios |

The skills in `.claude/skills/` run the steps: `start-pitch`, `ship-pitch` and `finish-block`.

## Files here

- `blocks/`: one note per block. Released: [[1-sing-along|Block 1, Sing along]] (0.1.0), [[2-your-turn|Block 2, Your turn]] (0.2.0). Current: [[3-judge-the-step|Block 3, Judge the step]].
- `pitches/`: one note per pitch, and `_template.md`. Shipped pitches stay where they are, with status shipped.

## Later levels

Agreed in direction (Luk, 2026-11-14), not yet a block: a wider range and larger leaps; rhythmic dictation with rhythm syllables (taa, ti-ti, tiri-tiri); longer melodies and longer notes.
