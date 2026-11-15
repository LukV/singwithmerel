/**
 * `npm run tune`: what Merel hears in a recording, with the app's own detector and listening rule
 * (src/listen/). For each file in tuning/ (any format the Mac or ffmpeg reads: a phone's m4a is
 * fine) and each of Merel's clips in voice/, it prints the notes heard, in order, when each was
 * heard, and how far off it was, in cents. The recordings are for tuning only and never committed.
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { centsOf, fold, LISTEN, listenFor } from '../src/listen/ear.ts';
import { Tracker, type Frame } from '../src/listen/tracker.ts';
import { toWav } from './voice/convert.ts';
import { readWav } from './voice/wav.ts';

const NAMES = ['do', 'do♯', 're', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
const AUDIO = /\.(wav|m4a|mp3|aac|aif|aiff|caf|ogg|flac|3gp|amr)$/i;

export interface Heard {
  /** Seconds from the start of the file. */
  time: number;
  /** The nearest note, by name, and how far from it. */
  name: string;
  cents: number;
}

/** The notes the listening rule hears in a sound, each named by the median pitch of its held part. */
export function hearSound(rate: number, samples: Float32Array): Heard[] {
  const tracker = new Tracker(rate);
  const ear = listenFor(Array.from({ length: 1000 }, () => ({ step: 0, beats: 1 })));
  const recent: Frame[] = [];
  const heard: Heard[] = [];
  for (let i = 0; i < samples.length; i += 128) {
    for (const frame of tracker.push(samples.subarray(i, i + 128))) {
      recent.push(frame);
      if (recent.length > 100) recent.shift();
      if (!ear.hear(frame)) continue;
      const held = recent
        .filter((f) => f.hz !== null && f.level >= LISTEN.gate && frame.time - f.time <= LISTEN.hold + 0.01)
        .map((f) => centsOf(f.hz!))
        .sort((a, b) => a - b);
      const c = held[Math.floor(held.length / 2)]!;
      const semitone = Math.round(c / 100);
      heard.push({ time: frame.time, name: NAMES[((semitone % 12) + 12) % 12]!, cents: fold(c - semitone * 100) });
    }
  }
  return heard;
}

function read(file: string): { rate: number; samples: Float32Array } {
  if (extname(file).toLowerCase() === '.wav') {
    try {
      return readWav(readFileSync(file));
    } catch {
      // a WAV in a format readWav does not know: convert it like the others
    }
  }
  const dir = mkdtempSync(join(tmpdir(), 'merel-tune-'));
  try {
    const wav = join(dir, 'take.wav');
    toWav(file, wav);
    return readWav(readFileSync(wav));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function report(file: string): void {
  try {
    const { rate, samples } = read(file);
    const heard = hearSound(rate, samples);
    const notes = heard.map((h) => `${h.name}${h.cents >= 0 ? '+' : ''}${Math.round(h.cents)}`).join(' ');
    console.log(`${file.padEnd(28)} ${heard.length ? notes : '(nothing heard)'}`);
  } catch (error) {
    console.log(`${file.padEnd(28)} could not be read: ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  console.log(`Listening rule: a tone steady within ${LISTEN.steady} cents for ${LISTEN.hold} s, above level ${LISTEN.gate}.`);
  console.log('Each note heard: its name and how far off, in cents.\n');
  const takes = existsSync('tuning') ? readdirSync('tuning').filter((f) => AUDIO.test(f)).sort() : [];
  if (takes.length) for (const f of takes) report(join('tuning', f));
  else console.log('No recordings in tuning/ yet (docs/planning/blocks/2-your-turn.md says how to make them).\n');
  if (takes.length) console.log('');
  const clips = existsSync('voice') ? readdirSync('voice').filter((f) => f.endsWith('.wav')).sort() : [];
  for (const f of clips) report(join('voice', f));
}
