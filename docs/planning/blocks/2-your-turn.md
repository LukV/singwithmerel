---
project: merel
type: block
status: draft
updated: 2026-11-14
---
	# Block 2: Your turn

**In brief.** Merel starts listening. Release 2 hears a steady tone per note in Your turn; release 3 judges each note against the target, mildly, as [[architecture/0010-overview#Voice evaluation|the overview]] describes. Sketched only; shaped with Luk when block 1 is merged.

## Slots

| # | Pitch | Status |
|---|---|---|
| 2.1 | Microphone and a steady tone: permission at the first Your turn, the AudioWorklet, the fallback to release 1 | draft |
| 2.2 | The mild judge: pitch detection, octave folding, tolerance and hold, tuning against real voices | draft |

## Open before shaping

- Which pitch detector, measured on a few real voices: a child, a woman, a man.
- Whether the judge's numbers (one semitone, 0.3 s) feel mild enough, tried with people who do not sing.
