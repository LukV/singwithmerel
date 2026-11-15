import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeWav } from '../../scripts/voice/wav.ts';

/**
 * The sound Chromium's fake microphone plays, over and over, for the listening check: the scale
 * of do major sung by a plain voice-like tone, 0.6 s a note with a short breath between.
 */
export function fakeMicFile(): string {
  const rate = 48_000;
  const notes = [0, 2, 4, 5, 7, 9, 11, 12].map((s) => 261.63 * 2 ** (s / 12));
  const note = 0.6;
  const breath = 0.15;
  const samples = new Float32Array(Math.round(notes.length * (note + breath) * rate));
  notes.forEach((hz, k) => {
    const from = Math.round(k * (note + breath) * rate);
    for (let i = 0; i < note * rate; i++) {
      const t = i / rate;
      const p = 2 * Math.PI * hz * t;
      const envelope = Math.min(1, t / 0.03, (note - t) / 0.05);
      samples[from + i] = 0.3 * envelope * (Math.sin(p) + 0.5 * Math.sin(2 * p) + 0.25 * Math.sin(3 * p));
    }
  });
  const dir = join('node_modules', '.cache', 'merel');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'fake-mic-scale.wav');
  writeFileSync(file, writeWav({ rate, samples }));
  return file;
}
