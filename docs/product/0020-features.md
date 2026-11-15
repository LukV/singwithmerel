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

The first screen is the identity, always exactly one screen high so the lesson starts below it: the wordmark, "You play. He sings.", Start, and Merel singing. Start scrolls gently to the first exercise. On a phone the instrument slides up when you press Start, scroll past the first screen, or start any exercise, and the first screen holds a line on headphones (and on an iPhone, one on the silent switch).

The instrument shows real notation: treble clef, 4/4 time signature, stems, bar lines. Under each note, its solfege name and, where the language uses them, its letter name. Each key shows its note's colour dot, its solfege name, its letter name and, on a computer, the keyboard key that plays it (A S D F G H J K for do to high do). The keys sound like a grand piano ([[013-piano-samples]]).

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
3. **Your turn.** Merel is silent and listens; you sing alone. The notes on the staff are outlined, the next one to sing brighter, and a soft dot follows your voice. Each note fills in its colour when you hold it close enough, in any octave, and Merel nods. When every note is found, Merel bows and the dot fills; then "next round".

**A miss.** When you stop singing before every note is found, or sing on past the notes left, Merel says something mild that names where to go on ("Almost. Sing it again from mi."). The notes found stay filled, and you sing again from the first one not found, as often as you like. After two such tries he offers Hear it, which turns into the filled button; nothing resets, and Skip this level stays. Judging is mild: less than a semitone off counts, rhythm and timing are not judged, and there is no score.

**The microphone.** At the first Your turn Merel asks in one sentence ("Merel listens while you sing. Your voice stays on this device."), with "Let him listen" and "Not now"; only then does the browser ask. The answer is remembered. The microphone is open only during Your turn. Said no, or the microphone is refused, missing or fails: Merel says once that he will not listen this time, the round counts after Sing along as in 0.1.0, and Your turn is practice. A quiet "Let Merel listen" on the card asks the browser again; he listens from the next round. If it still does not open, the card says which: the browser keeps the microphone closed (allow it in the browser's settings), or the microphone did not open on this device. Pressing a key during Your turn does not count as your voice: the piano note is ignored while it rings.

Recognition (exercise 4) sings on "du" and replaces steps 2 and 3 with answering, while the staff stays empty: first the direction of each step (up or down, two big buttons), then the notes on the keys, which appear on the staff as you find them. Each right answer says yes and stays on the card: the directions with a tick, then the three notes, filled in their colour and name as you find them, with the next one outlined. On a phone the keys come back up when it is time to find the notes. A wrong answer shows the note you chose, in its colour, and you try again; it never resets the round. "Hear it" sings the melody again at any time.

Merel acts the round out: singing while he sings, thinking over up or down, listening while you sing or search, nodding softly at each note you find, bowing when a round completes, waiting otherwise.

With Merel listening, a round completes in Your turn; without, after Sing along ([[014-your-turn-earns-the-dot]], [[architecture/0010-overview#Voice evaluation|voice evaluation]]). Recognition never uses the microphone.

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

## Install, offline, privacy

- **Installable.** Merel installs to the home screen like an app, with its own icon. On a phone or tablet, after the first completed level, the lesson invites you once, just before the next level, and scrolls to the invitation: on an iPhone or iPad with how (Share, then Add to Home Screen) and why (Safari forgets progress after seven days without a visit); where the browser can install it, with an Install button. "Not now" closes it for good.
- **Offline.** After the first visit Merel starts, sings and keeps your progress without a network.
- **Updates.** A new release arrives by itself: the next time Merel opens with a network, or, if it stays open, once no round is under way. Nothing to do and nothing lost.
- **Privacy and about.** A short page per language, linked at the foot of the lesson: no accounts, nothing sent, the microphone only during Your turn and only if you let him, analysed on the device and never recorded, what the progress code holds, how to clear everything, and who made Merel.

## Languages

English, French and Dutch, each at its own path: /en, /fr, /nl. The first visit follows the browser's language; a switch in the header changes it and is remembered.

| | EN | FR | NL |
|---|---|---|---|
| Note names | do re mi fa sol la ti | do ré mi fa sol la si | do re mi fa sol la si |
| Letter names shown | C D E F G A B | no | C D E F G A B |

English teaching usually uses movable do and French and Dutch fixed do; in do major both give the same names, so the app needs no setting for it. Copy is written per language, short, not translated word for word.
