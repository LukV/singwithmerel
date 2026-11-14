# Making Merel's voice

**In brief.** Merel's 17 clips are made once, in Synthesizer V: open `merel-17.mid`, choose a voice, render one WAV, and `split.py` cuts it into the 17 files `npm run voice` expects. What each clip must be: `docs/reference/0010-voice-clips.md`.

## What is here

| File | What |
|---|---|
| `merel-17.mid` | the 17 notes in order (do re mi fa sol la si do on C4 to C5, ti on B4, du on C4 to C5), each one beat at 50 per minute (1.2 s) with a beat of silence between, a bar of silence first; every note carries its syllable as a lyric |
| `split.py` | cuts the render into `voice/<name>.wav`; Python 3, standard library only |

## Steps

1. **Open the notes.** In Synthesizer V, import `merel-17.mid` (drag it onto the editor, or the import command in the File menu). If the syllables do not come along: select all notes, choose *Insert Lyrics* and paste `do re mi fa sol la si do ti du du du du du du du du`.
2. **Choose one voice** for the whole track, and check its licence allows short rendered clips to be published in an open-source app (Apache 2.0, public repository).
3. **Check the syllables.** Listen to each note. If the voice's language says a syllable wrong (an English voice may sing "re" as "ree"), type that note's phonemes. In English: do `d ow`, re `r ey`, mi `m iy`, fa `f aa`, sol `s ow l`, la `l aa`, si `s iy`, ti `t iy`, du `d uw`. A voice that sings Spanish says solfege natively, if yours offers it.
4. **Keep the pitch steady.** Vibrato off, no pitch bends: each clip must stay within 10 cents of its note.
5. **Render** one WAV of the whole track: 48 kHz, 24 bit, mono if offered. Save it as `voice/make/render.wav` (not in `voice/` itself, where it would be taken for a clip).
6. **Cut it:** `python3 voice/make/split.py voice/make/render.wav`. It writes the 17 clips into `voice/` and says if it finds more or fewer than 17 notes.
7. **Check it:** `npm run voice`. It measures each clip and refuses any more than 10 cents off. Fix a refused note in Synthesizer V, render again, cut again.
8. **Record the voice** in `voice/manifest.json`: `{ "octaveOffset": 0, "voice": "<voice name>, Synthesizer V" }` (`-1` if you chose a voice that sings an octave lower).
