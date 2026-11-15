import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeWav } from '../../scripts/voice/wav.ts';

/**
 * The sound Chromium's fake microphone plays, over and over, for the listening check, by a plain
 * voice-like tone, 0.6 s a note with a short breath between: twice the scale of do major with re
 * sung instead of mi, then the scale from mi, each followed by a pause longer than the judge's
 * silence. Wherever the loop is when Your turn starts, a try misses before the round completes.
 */
const WRONG = [0, 2, 2, 5, 7, 9, 11, 12];
const FROM_MI = [4, 5, 7, 9, 11, 12];
const PAUSE = 2;

export function fakeMicFile(): string {
  const rate = 48_000;
  const note = 0.6;
  const breath = 0.15;
  const parts = [WRONG, WRONG, FROM_MI];
  const notes: { hz: number; at: number }[] = [];
  let at = 0;
  for (const part of parts) {
    for (const s of part) {
      notes.push({ hz: 261.63 * 2 ** (s / 12), at });
      at += note + breath;
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
  const file = join(dir, 'fake-mic-scale-with-a-miss.wav');
  writeFileSync(file, writeWav({ rate, samples }));
  return file;
}
