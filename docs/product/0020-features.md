---
project: merel
type: features
status: draft
updated: 2026-11-14
---
# Features

**In brief.** The screen splits into a lesson that scrolls and an instrument that stays put. The lesson is a path of numbered exercises; each exercise runs as rounds of Hear it, Sing along and Your turn. One completed round fills one dot; five dots open the next level. Everything stays in do major, and in any octave.

## Screen

| Device | Lesson | Instrument |
|---|---|---|
| Desktop, tablet, phone in landscape | Left half, scrolls | Right half, fixed: staff and keys |
| Phone in portrait | Top, scrolls, one exercise card at a time | Docked at the bottom, about 45% of the screen; the staff follows the current note; a handle tucks it away to a slim bar and brings it back (tap or swipe) |

The first screen is the identity, always exactly one screen high so the lesson starts below it: the wordmark, "You play. He sings.", Start, and Merel singing. Start scrolls gently to the first exercise. On a phone the instrument slides up when you press Start.

The instrument shows real notation: treble clef, 4/4 time signature, stems, bar lines. Under each note, its solfege name and, where the language uses them, its letter name. Each key shows its note's colour dot, its solfege name, its letter name and, on a computer, the keyboard key that plays it (A S D F G H J K for do to high do).

## The lesson as a path

The exercises hang from a thin hand-drawn line, each on a numbered node.

| State | Node | Card |
|---|---|---|
| Active | Filled black, white number | Underlined title, filled button, Merel moves |
| Upcoming | Outlined | Still Merel |
| Completed | Grey with a tick | Grey text, Merel bows, dots full |

## One round

1. **Hear it.** Merel sings the notes alone, by name, while the staff marks each one.
2. **Sing along.** A beat later he sings them again and you sing with him.
3. **Your turn.** Merel is silent and listens; you sing alone, then press "next round". Until the app listens (block 2), Your turn is practice: the round is already complete.

Recognition (exercise 4) sings on "du" and replaces steps 2 and 3 with answering, while the staff stays empty: first the direction of each step (up or down, two big buttons), then the notes on the keys, which appear on the staff as you find them. Each right answer says yes and stays on the card: the directions with a tick, then the three notes, filled in their colour and name as you find them, with the next one outlined. On a phone the keys come back up when it is time to find the notes. A wrong answer shows the note you chose, in its colour, and you try again; it never resets the round. "Hear it" sings the melody again at any time.

Merel acts the round out: singing while he sings, thinking over up or down, listening while you sing or search, bowing when a round completes, waiting otherwise.

What makes a round "completed" grows per release, from sang along to the end, to a steady tone per note, to a match per note: [[architecture/0010-overview#Voice evaluation|voice evaluation]].

## Dots and levels

- **One dot is one completed round.** Five dots per level (Luk, 2026-11-14).
- **Five full dots open the next level.**
- **Skip:** a quiet "skip this level" opens the next level without filling the dots, for teachers and confident singers.
- A completed or skipped level turns quiet and grey; the next becomes active and the lesson scrolls to it. A completed level can be played again; an upcoming one can be heard, not started.
- **Progress** stays in the browser. A short progress code, at the end of the lesson, copies it to another browser or phone and pastes it back. "Start over", under the code, clears every dot and level after asking once.

## Exercises

Range for now: one octave, low do (C4) to high do (C5).

| # | Exercise | Merel sings | You do |
|---|---|---|---|
| 1 | Low to high | do re mi fa sol la si do | Sing the scale up |
| 2 | High to low | do si la sol fa mi re do | Sing the scale down |
| 3 | Sing a melody | A random three-note melody, by name | Sing it back |
| 4 | Recognise a melody | A random three-note melody on "du" | Up or down per step, then the notes on the keys |

## The random melody

Three notes, the way a teacher dictates in class: a start note, then a direction. The point is first to hear whether a note is higher or lower than the one before, and only then which note it is.

- **Shapes**, one per round, at random:
    - up, up
    - down, down
    - up, then down to below the start note
- **Notes** come from the do major scale within the range. The start note is drawn so the shape fits the range.
- **Rhythm:** one 4/4 bar, quarter, quarter, half.
- **Never the same melody twice in a row.**

## Later levels

Planned, not specified yet ([[planning/_about|the plan]]):

- A wider range, beyond one octave, and larger leaps.
- Rhythmic dictation with rhythm syllables (taa, ti-ti, tiri-tiri).
- Longer melodies and longer notes.

## Languages

English, French and Dutch, each at its own path: /en, /fr, /nl. The first visit follows the browser's language; a switch in the header changes it and is remembered.

| | EN | FR | NL |
|---|---|---|---|
| Note names | do re mi fa sol la ti | do ré mi fa sol la si | do re mi fa sol la si |
| Letter names shown | C D E F G A B | no | C D E F G A B |

English teaching usually uses movable do and French and Dutch fixed do; in do major both give the same names, so the app needs no setting for it. Copy is written per language, short, not translated word for word.
