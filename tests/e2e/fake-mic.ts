import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeWav } from '../../scripts/voice/wav.ts';

/**
 * The sound Chromium's fake microphone plays, over and over, for the listening check, by a plain
 * voice-like tone, 0.6 s a note with a short breath between: the scale with a wrong note, do
 * again where mi should be, after re, then a pause longer than the judge's silence. The wrong note
 * resets nothing: mi after it is found, and the scale completes. A try that picks the sound up
 * part way through ends in the pause, and starts again from do.
 */
const SUNG = [0, 2, 0, 4, 5, 7, 9, 11, 12];
/** After the wrong note, a second's thought (under the judge's silence), so the card's message shows a while. */
const THINK = { after: 2, seconds: 1 };
const PAUSE = 3.5;

export function fakeMicFile(): string {
  const rate = 48_000;
  const note = 0.6;
  const breath = 0.15;
  const parts = [SUNG];
  const notes: { hz: number; at: number }[] = [];
  let at = 0;
  for (const part of parts) {
    for (const [i, s] of part.entries()) {
      notes.push({ hz: 261.63 * 2 ** (s / 12), at });
      at += note + breath + (i === THINK.after ? THINK.seconds : 0);
    }
    at += PAUSE;
  }
  const samples = new Float32Array(Math.round(at * rate));
  notes.forEach(({ hz, at }) => {
    const from = Math.round(at * rate);
    for (let i = 0; i < note * rate; i++) {
      const t = i / rate;
      const p = 2 * Math.PI * hz * t;
      const envelope = Math.min(1, t / 0.03, (note - t) / 0.05);
      samples[from + i] = 0.3 * envelope * (Math.sin(p) + 0.5 * Math.sin(2 * p) + 0.25 * Math.sin(3 * p));
    }
  });
  const dir = join('node_modules', '.cache', 'merel');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'fake-mic-scale-with-a-wrong-note.wav');
  writeFileSync(file, writeWav({ rate, samples }));
  return file;
}
