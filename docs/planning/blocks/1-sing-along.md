---
project: merel
type: block
status: in-cycle
updated: 2026-11-14
---
# Block 1: Sing along

**In brief.** Merel 0.1.0, live at singwithmerel.com: the lesson and the instrument, all four exercises, Merel singing the notes by name, progress that survives a reload, in English, French and Dutch, installable and offline. Nothing listens to the voice yet: a singing round completes when you sang along to the end, a recognition round when your answers are right. Three large pitches, one branch, one pull request at the end.

## Framing

Everything about Merel's look, character, exercises and rules is settled in these docs (Luk and Claude, 12 to 14 November 2026). This block turns it into a real app and puts it online, so that Luk and the first users can practise with it before the microphone arrives in [[2-your-turn|block 2]]. The canvas mockup already shows the lesson, the instrument and the round logic working; the block builds that properly, on a phone too.

Read first: [[0010-vision]], [[0020-features]], [[DESIGN]], [[architecture/0010-overview|the overview]], the decisions, and [[0010-voice-clips]].

## Before the first pitch

- **Stack.** Vite, TypeScript and Preact, with Vitest for unit tests and Playwright for a browser check: [[012-stack]].
- **Repository.** `~/Documents/Code/merel`, `main` as the first branch, then `block/1-sing-along`. The remote is the public GitHub repository [LukV/singwithmerel](https://github.com/LukV/singwithmerel), open source under Apache 2.0 (Luk, 2026-11-14).
- **CI, versions and deploy.** GitHub Actions checks every push and pull request, commit messages included (pitch 1.1). Release tags deploy: candidates to next.singwithmerel.com, releases to singwithmerel.com (pitch 1.3). [[011-versions-and-releases]] has the flow.
- **The docs folder** is linked into Luk's vault; it stays where it is, inside the repository.

## Slots

| # | Pitch | Status | What Luk can try at the end |
|---|---|---|---|
| 1.1 | [[1-1-instrument-and-lesson\|The instrument and the lesson]] | shipped | The app on a laptop and a phone: identity screen, the lesson path, the staff and the keys that sound, Merel moving, three languages |
| 1.2 | [[1-2-rounds-and-progress\|Rounds, melodies and progress]] | shipped | All four exercises playable, rounds and dots, levels that open, progress kept, Merel's clips or a stand-in |
| 1.3 | [[1-3-merel-goes-live\|Merel goes live]] | in-cycle | singwithmerel.com on a phone, installed, working offline |

1.1 comes first; 1.2 builds on it; 1.3 needs both, and the voice clips if they exist by then.

## Definition of done

Items marked *(after release)* become true only after Luk merges, bumps and tags; Luk checks them, and `finish-block` leaves them open when it opens the pull request (Luk, 2026-11-14).

- [ ] *(after release)* https://singwithmerel.com serves release 1 over HTTPS; www redirects to it.
- [ ] /en, /fr and /nl work; the first visit follows the browser's language.
- [ ] The four exercises are playable to the end on iPhone Safari, Android Chrome and a desktop browser.
- [ ] Five completed rounds open the next level; "skip this level" works.
- [ ] Progress survives a reload, and the progress code restores it in a cleared browser.
- [ ] The app installs to the home screen and works with no network after the first visit.
- [ ] Merel sings the note names from the clips when they are in place, and falls back to a plain tone when they are not.
- [ ] Unit tests and the browser check pass; the build has no errors or warnings; CI is green on the pull request.
- [ ] *(after release)* A pushed candidate tag deploys to next.singwithmerel.com and a release tag to singwithmerel.com, through GitHub Actions, with no AWS keys stored in GitHub.
- [ ] *(after release)* `v0.1.0` is tagged, with a `CHANGELOG.md` and a GitHub release; every commit on the block passes `cz check`.
- [ ] Every page in `docs/` is true for what was built.

## Test scenario

Luk runs this on the release candidate, after merging and `cz bump --prerelease rc`, at https://next.singwithmerel.com. About twenty minutes. When it passes, `cz bump` releases 0.1.0 and steps 1 and 9 are repeated once on https://singwithmerel.com.

1. On a laptop, open https://next.singwithmerel.com. You land on /en, /fr or /nl, following your browser's language, and see the identity screen with Merel singing.
2. Press Start, then do exercise 1 to the end: Hear it, Sing along, five times. Five dots fill, Merel bows, exercise 2 becomes active.
3. Press "skip this level" on exercise 2. Exercise 3 opens.
4. Do one round of exercise 3. The melody is three notes in one of the three shapes; the staff shows them in a 4/4 bar.
5. Do one round of exercise 4: answer up or down for each step, then find the notes on the keys. A wrong note shows in its colour and lets you try again.
6. Switch to French. The note names read do ré mi, there are no letter names, and the progress is unchanged.
7. Reload the page. You are where you were.
8. Copy the progress code. Clear the site's data in the browser, reload, paste the code. Your progress is back.
9. On your phone, open the site and add it to the home screen. Open it from there: it opens full screen with the instrument docked at the bottom.
10. Switch on airplane mode and close and reopen the app. It still works, and Merel still sings.
11. With the phone's silent switch on, Merel is silent and the first screen's tip says why. (A person judges: is the tip clear?)

## Later

*(Things that turn up during the block and wait for a later one.)*
