---
project: merel
type: design
status: draft
updated: 2026-11-14
---
# Design

**In brief.** Black and paper carry everything, hand lettering speaks, and colour is an ink dot that belongs to one note. The look follows Print Club London's hand-drawn identity in spirit, with a clear-line edge from Joost Swarte in how Merel is built: discs and bars, one line weight, a black contour on every coloured shape. The canvases are the reference; this page holds the rules and the tokens a stylesheet needs.

## Where to look

- [Style guide canvas](https://claude.ai/artifact/5seqHFaDNWxYoyJ2sa95wY), page "Style guide":
    - **1 · Identity**: wordmark, tagline, Start, Merel, the scale as seven ink dots on a hand-drawn staff.
    - **2 · Typography and colour**: lettering, small text, buttons, the seven note colours, the hand-drawn signs.
    - **3 · Merel**: the five poses, animated.
    - **Mockup · Split screen with challenge feed**: the working prototype of the lesson and the instrument (open it with Play).
- Same canvas, page "Earlier rounds": what was tried and dropped, kept for reference.

The canvas lives on claude.ai and Claude Code cannot open it. Its sources are copied here:

| Path | What | Use |
|---|---|---|
| `assets/merel/merel-<pose>.svg` | the five poses, animated (motion CSS inside) | open in a browser to see him move |
| `assets/merel/merel-<pose>-static.svg` | the same, without motion | the drawing to port into a component |
| `assets/merel/merel-motion.css` | the keyframes; `class="live p-<pose>"` on the svg starts them | port as is |
| `assets/signs/wordmark.svg` | MEREL, hand-drawn | use as is |
| `assets/signs/clef.svg`, `sign-*.svg` | treble clef and the five signs (sing, again, right, note, listen) | use as is, colour by `stroke` |
| `mockup/*.dc.html` | the canvas artboards' source: identity, type and colour, Merel, and the split-screen mockup | read for layout, copy and the round logic in the script at the bottom; they need the canvas runtime to render, so they do not open on their own |

Merel's parts are grouped for motion: `m-bob` (whole bird), `m-head`, `m-beak-u` and `m-beak-l`, `m-eye`, `m-tail`, `m-marks` (the dashes and note). Keep those groups when porting.

## Tokens

| Token | Value | Use |
|---|---|---|
| ink | #121212 | text, Merel, the instrument |
| paper | #F4F3EF | ground |
| quiet | #6B6B6B | completed exercises |
| beak | #FF8A1F | Merel's beak and eye ring |
| bow | #E5354B | Merel's bow tie |
| note-do | #E5354B | do and high do |
| note-re | #F58A2A | re |
| note-mi | #F4C83F | mi |
| note-fa | #45B97C | fa |
| note-sol | #4AA8E8 | sol |
| note-la | #8A6BE0 | la |
| note-si | #E86BB0 | si (ti in English) |

## Type

| Role | Face | Rule |
|---|---|---|
| Wordmark | Hand-drawn MEREL | An SVG drawing, never set in a font |
| Headlines, note names, feedback | Kalam Bold | Capitals; a stand-in for real hand lettering (see below) |
| Small text, labels, buttons | Hanken Grotesk 300 to 500 | Labels in spaced capitals |

Kalam is a free Google font that imitates marker handwriting; Print Club London's lettering is drawn by hand, letter by letter. Merel launches with Kalam ([[009-lettering]]). Fonts are self-hosted.

## Rules

1. **Colour belongs to a note** and is the same everywhere: on the staff, on the key, in the progress dots, in feedback.
2. **Colour shows only as a dot**, never as a background or a band.
3. **Real notation first**: clef, time signature, stems, bar lines; colour marks what was played or sung.
4. **Colour is never the only cue**: every note also shows its name, its letter where the language uses it, and its key.
5. **Lines are hand-drawn, one weight**; the staff and the keys wobble slightly. Merel is the exception: built from geometry.
6. **Touch targets at least 44 px**, the piano keys included: on a narrow phone the gutters give way, not the keys. Text contrast at least 4.5:1.

## Merel

A geometric blackbird of discs and rounded bars: black body and head, white shirt front with three studs, orange beak and eye ring, red bow tie, stick-tuft crest, coat tails. Five poses, each with its own movement:

| Pose | Used when | Movement |
|---|---|---|
| Waiting | an exercise is open but idle | breathes, blinks, glances round, flicks his tail |
| Singing | Hear it, Sing along, the identity screen | hops on the beat, beak opens and closes, head sways |
| Thinking | a step needs a decision | tips his head back |
| Listening | Your turn, recognition | cocks his head and holds it |
| Bowing | a round or level completed | a small dip, held |

Only Merel moves; nothing else animates, except the instrument sliding up on a phone when Start is pressed (Luk, 2026-11-14). Movement switches off under the system's reduced-motion setting. Merel never speaks in text: he acts.

A more naturalistic blackbird (long tail, level body, no shirt front) was tried on 2026-11-13 and dropped by Luk the same day; it is on the "Earlier rounds" page.
