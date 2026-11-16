---
project: merel
type: decision
status: accepted
updated: 2026-11-15
---
# 015 The pitch detector

**Decision.** Merel hears pitch with YIN (de Cheveigné and Kawahara, 2002), in our own small implementation (`src/listen/yin.ts`), running in an AudioWorklet on the audio thread. The microphone's sound is halved in sample rate (to 22 or 24 kHz, a plain average of two samples); every 240 samples, about 10 ms, YIN reads the last 1536, about 64 ms, between 50 Hz and 1100 Hz, with a threshold of 0.12. Each frame posts its pitch, clarity and level to the page; the sound itself is dropped. The same code checks Merel's clips (`npm run voice`) and reads recordings (`npm run tune`). Pitch 2.1 as shaped with Luk, 2026-11-14; settings measured 2026-11-15. The floor moved from 70 Hz to 50 Hz and the frame from 43 to 64 ms on 2026-11-15, after Luk's own scale down: started on a do of 129 Hz, his low do is 63 Hz, and the dev listening log showed every frame of it with no pitch and the deepest dip pinned at 70 Hz.

**Why.** YIN is classic, small and well understood: no AI and no dependency, and it was already measuring Merel's clips to within a cent. In a worklet it never competes with the page. 50 Hz to 1100 Hz covers a bass's low do (a man who starts the scale down near C3 ends near C2, about 65 Hz) to a child's high do; 64 ms holds three periods of the lowest pitch, and halving the rate halves the work without touching a voice. Measured: tones from 82 Hz to 988 Hz, at 44.1 and 48 kHz, are heard within 5 cents; each of Merel's 17 clips is heard as exactly one note, the right one; ten seconds of sound take about 390 ms on a recent Mac, about 4% of one core, with the longer frame; synthetic bass notes with a weak fundamental, as a laptop microphone hears them, are found from 55 Hz up. The recordings of a child, a woman and a man (block 2) check it on real voices in pitch 2.2.

**Rejected.** pitchy, the McLeod method (a good detector, but a dependency for what is sixty lines). Plain autocorrelation (more octave errors, the very thing YIN's normalisation fixes). A learned model such as CREPE (more accurate on hard voices, but large, slow on a phone, and AI where none is needed). Analysing on the main thread with an AnalyserNode (simpler, but frames drop whenever the page is busy).
