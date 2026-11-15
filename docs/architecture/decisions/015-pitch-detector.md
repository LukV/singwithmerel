---
project: merel
type: decision
status: accepted
updated: 2026-11-15
---
# 015 The pitch detector

**Decision.** Merel hears pitch with YIN (de Cheveigné and Kawahara, 2002), in our own small implementation (`src/listen/yin.ts`), running in an AudioWorklet on the audio thread. The microphone's sound is halved in sample rate (to 22 or 24 kHz, a plain average of two samples); every 240 samples, about 10 ms, YIN reads the last 1024, about 43 ms, between 70 Hz and 1100 Hz, with a threshold of 0.12. Each frame posts its pitch, clarity and level to the page; the sound itself is dropped. The same code checks Merel's clips (`npm run voice`) and reads recordings (`npm run tune`). Pitch 2.1 as shaped with Luk, 2026-11-14; settings measured 2026-11-15.

**Why.** YIN is classic, small and well understood: no AI and no dependency, and it was already measuring Merel's clips to within a cent. In a worklet it never competes with the page. 70 Hz to 1100 Hz covers a low man's do to a child's high do with room; 43 ms holds two periods of the lowest pitch, and halving the rate halves the work without touching a voice. Measured: tones from 82 Hz to 988 Hz, at 44.1 and 48 kHz, are heard within 5 cents; each of Merel's 17 clips is heard as exactly one note, the right one; ten seconds of sound take 185 ms on a recent Mac, under 2% of one core. The recordings of a child, a woman and a man (block 2) check it on real voices in pitch 2.2.

**Rejected.** pitchy, the McLeod method (a good detector, but a dependency for what is sixty lines). Plain autocorrelation (more octave errors, the very thing YIN's normalisation fixes). A learned model such as CREPE (more accurate on hard voices, but large, slow on a phone, and AI where none is needed). Analysing on the main thread with an AnalyserNode (simpler, but frames drop whenever the page is busy).
