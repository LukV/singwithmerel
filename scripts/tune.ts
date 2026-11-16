/**
 * `npm run tune`: what the judge finds in a recording, with the app's own detector and judge
 * (src/listen/). For each file in tuning/ (any format the Mac or ffmpeg reads: a phone's m4a is
 * fine), named `<voice>-<take>`, it prints how far off each note was sung and the notes the judge
 * finds. The recordings are for tuning only and never committed.
 *
 * The takes are untrained and a bit off, so they are measured and labelled first, not taken as in
 * tune: each note matched in order to the note meant, the key the take was sung in, and how far
 * off each note is in that key (`npm run tune -- --label` writes this to tuning/labels.json, to
 * read and correct by hand; later runs use that file). Do is movable: the judge takes a try's first
 * note as do, wherever it is sung, and judges each note from the one before, so each take is
 * judged as it was sung, and what counts is how far off each step is: uneven steps, scoops, short
 * notes; a slow drift is followed.
 *
 * An in-tune take should find every note. A take with a wrong note (a step a semitone or more
 * off) should find the notes before it, not the wrong one while it is sung, and not complete. Takes: `up` and `down` (the scale), `do-mi-sol`, and `offkey`, sung a little off and with
 * a wrong note, whose melody is not known: it is judged as the scale up and down from its first
 * note, and must complete neither.
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { SCALE_DOWN, SCALE_UP, type Melody } from '../src/melody/melody.ts';
import { centsOf, counts, JUDGE, judgeFor, reach, stepOf } from '../src/listen/judge.ts';
import { Tracker, type Frame } from '../src/listen/tracker.ts';
import { toWav } from './voice/convert.ts';
import { readWav } from './voice/wav.ts';

const NAMES = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do'];
const SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12];
const AUDIO = /\.(wav|m4a|mp3|aac|aif|aiff|caf|ogg|flac|3gp|amr)$/i;
const DO_MI_SOL: Melody = [0, 2, 4].map((step) => ({ step, beats: 1 }));
const LABELS = join('tuning', 'labels.json');
const LABELS_ABOUT =
  'Each note of a take, matched in order to the note meant, in the key the take was sung in (key: cents above C4). off: cents from the note meant in that key; in tune within 50, a bit off under 100, else a wrong note. Made by npm run tune -- --label; correct by hand.';

/** A step within this many cents of the edge of what counts may count or not: the judge measures it on its own frames. */
const DOUBT = 30;

const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]!;

export interface Sung {
  start: number;
  end: number;
  /** Median pitch, in cents above C4. */
  cents: number;
}

/** The notes sung, as runs of clear pitch that stay within 60 cents and last 0.15 s. */
export function notesOf(frames: Frame[]): Sung[] {
  const peak = Math.max(0, ...frames.map((f) => f.level));
  const notes: Sung[] = [];
  let run: number[] | null = null;
  let start = 0;
  let last = 0;
  const close = () => {
    if (run && last - start >= 0.15) notes.push({ start, end: last, cents: median(run) });
    run = null;
  };
  for (const f of frames) {
    const clear = f.hz !== null && f.level >= Math.max(0.003, peak * 0.08) && f.clarity > 0.6;
    if (!clear) {
      if (run && f.time - last > 0.1) close();
      continue;
    }
    const c = centsOf(f.hz!);
    if (run && Math.abs(c - median(run.slice(-8))) > 60) close();
    if (!run) {
      run = [];
      start = f.time;
    }
    run.push(c);
    last = f.time;
  }
  close();
  return notes;
}

export type Verdict = 'in tune' | 'a bit off' | 'wrong note';
const verdictOf = (off: number): Verdict => (Math.abs(off) <= 50 ? 'in tune' : Math.abs(off) < 100 ? 'a bit off' : 'wrong note');

export interface Label {
  take: string;
  /** The key the take was sung in, in cents above C4: the median offset of its notes from those meant. */
  key: number;
  notes: { meant: string; start: number; end: number; off: number; verdict: Verdict }[];
}

/**
 * Labels a take: its notes matched in order to the melody meant (when there are more pieces than
 * notes, the two nearest in pitch are one note sung in two pieces, and joined), the key it was
 * sung in, and how far off each note is in that key.
 */
export function labelTake(take: string, sung: Sung[], melody: Melody): Label {
  const notes = [...sung];
  const length = (n: Sung) => n.end - n.start;
  while (notes.length > melody.length) {
    let k = 0;
    for (let i = 1; i < notes.length - 1; i++) {
      if (Math.abs(notes[i + 1]!.cents - notes[i]!.cents) < Math.abs(notes[k + 1]!.cents - notes[k]!.cents)) k = i;
    }
    const a = notes[k]!;
    const b = notes[k + 1]!;
    notes.splice(k, 2, { start: a.start, end: b.end, cents: (a.cents * length(a) + b.cents * length(b)) / (length(a) + length(b)) });
  }
  const meant = (i: number) => SEMITONES[melody[i]!.step]! * 100;
  const key = notes.length ? median(notes.map((n, i) => n.cents - meant(i))) : 0;
  return {
    take,
    key: Math.round(key),
    notes: notes.map((n, i) => {
      const off = Math.round(n.cents - key - meant(i));
      return { meant: NAMES[melody[i]!.step]!, start: +n.start.toFixed(2), end: +n.end.toFixed(2), off, verdict: verdictOf(off) };
    }),
  };
}

export interface Judged {
  /** The times (seconds) each note was found, in order, in the try that got furthest. */
  times: number[];
  misses: number;
  wrongs: number;
}

/** Judges frames for a melody, moved by `shift` cents first. */
export function judgeTake(frames: Frame[], melody: Melody, shift: number): Judged {
  const judge = judgeFor(melody);
  const factor = 2 ** (shift / 1200);
  const times: number[] = [];
  let best: number[] = [];
  let misses = 0;
  let wrongs = 0;
  for (const f of frames) {
    const e = judge.hear({ ...f, hz: f.hz === null ? null : f.hz * factor });
    if (e?.type === 'found') times.push(f.time);
    if (e?.type === 'wrong') wrongs++;
    if (e?.type === 'miss') {
      // A miss starts again from do: the try that got furthest is the one reported.
      misses++;
      if (times.length > best.length) best = [...times];
      times.length = 0;
    }
  }
  return { times: times.length >= best.length ? times : best, misses, wrongs };
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

/** The pitch track of a file, fed to the tracker in blocks of 128 samples as the worklet is. */
function framesOf(file: string): Frame[] {
  const { rate, samples } = read(file);
  const tracker = new Tracker(rate);
  const frames: Frame[] = [];
  for (let i = 0; i < samples.length; i += 128) frames.push(...tracker.push(samples.subarray(i, i + 128)));
  return frames;
}

const keyName = (cents: number) => {
  const s = Math.round(cents / 100);
  const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const off = Math.round(cents - s * 100);
  return `${names[((s % 12) + 12) % 12]}${off >= 0 ? '+' : ''}${off}`;
};

function describe(melody: Melody, j: Judged): string {
  const found = j.times.map((t, i) => `${NAMES[melody[i]!.step]} ${t.toFixed(2)}s`).join(', ');
  const waits = j.times.length === melody.length ? '' : `, waits for ${NAMES[melody[j.times.length]!.step]}`;
  const misses = j.misses ? `, ${j.misses} ${j.misses > 1 ? 'misses' : 'miss'}` : '';
  return `${j.times.length}/${melody.length} found${waits}${misses}${found ? ` (${found})` : ''}`;
}

function readLabels(): Record<string, Label> {
  if (!existsSync(LABELS)) return {};
  const list = (JSON.parse(readFileSync(LABELS, 'utf8')) as { takes: Label[] }).takes;
  return Object.fromEntries(list.map((l) => [l.take, l]));
}

/** Judges one take and says whether it did what it should. */
function report(file: string, labels: Record<string, Label>, made: Label[]): boolean {
  const name = basename(file, extname(file));
  const take = name.replace(/^[^-]+-/, '');
  let frames: Frame[];
  try {
    frames = framesOf(file);
  } catch (error) {
    console.log(`    ${name.padEnd(18)} could not be read: ${(error as Error).message}`);
    return false;
  }
  const melody = take === 'up' ? SCALE_UP : take === 'down' ? SCALE_DOWN : take === 'do-mi-sol' ? DO_MI_SOL : null;
  if (melody) {
    const l = labels[name] ?? labelTake(name, notesOf(frames), melody);
    made.push(l);
    // As the judge hears it: the first note is where you start, and each note after is judged by
    // the step from the note before: the right way, from half its size to well past it.
    const notes = l.notes.map((n, i) => {
      if (i === 0) return { ...n, step: 0, wrong: false, edge: Infinity };
      const size = stepOf(melody, i);
      const moved = SEMITONES[melody[i]!.step]! * 100 + n.off - (SEMITONES[melody[i - 1]!.step]! * 100 + l.notes[i - 1]!.off);
      const { low, high } = reach(size);
      const edge = Math.min(Math.abs(Math.abs(moved) - low), Math.abs(Math.abs(moved) - high));
      return { ...n, step: Math.round(moved), wrong: !counts(moved, size), edge };
    });
    const wrong = notes.findIndex((n) => n.wrong);
    const j = judgeTake(frames, melody, 0);
    // With a wrong step: every note before it found, the take not complete, and the wrong note not
    // found while it was sung (a later note may yet stand in for it, as a singer would do). A step
    // near the edge (within DOUBT) may go either way.
    const at = wrong < 0 ? undefined : j.times[wrong];
    const span = wrong < 0 ? null : notes[wrong]!;
    const complete = j.times.length === melody.length;
    const stops = j.times.length >= wrong && !complete && !(at !== undefined && span && at >= span.start && at <= span.end + JUDGE.gap);
    // Near the edge (within DOUBT), the step the judge waits for, or the wrong one, may go either way.
    const waits = notes[wrong < 0 ? j.times.length : wrong];
    const doubtful = !!waits && waits.edge < DOUBT;
    const ok = wrong < 0 ? complete || doubtful : stops || (doubtful && complete);
    const offs = notes.map((n, i) => (i === 0 ? n.meant : `${n.step >= 0 ? '+' : ''}${n.step} ${n.meant}${n.wrong ? '!' : ''}`)).join(' ');
    console.log(`${ok ? 'ok ' : 'NO '} ${name.padEnd(18)} do at ${keyName(l.key + l.notes[0]!.off).padEnd(6)} ${offs}`);
    const should =
      wrong < 0
        ? `every note${doubtful ? ` (or stop at ${waits!.meant}: its step is within ${DOUBT} cents of the edge)` : ''}`
        : `the notes before its wrong ${notes[wrong]!.meant}, not that one, and not complete${doubtful ? ` (or every note: a step is within ${DOUBT} cents of the edge)` : ''}`;
    console.log(`    ${''.padEnd(18)} should find ${should}: ${describe(melody, j)}`);
    return ok;
  }
  if (take === 'offkey') {
    // Its first note is do, as the judge takes it: low do for the scale up, high do for the scale down.
    const up = judgeTake(frames, SCALE_UP, 0);
    const down = judgeTake(frames, SCALE_DOWN, 0);
    const ok = up.times.length < 8 && down.times.length < 8;
    console.log(`${ok ? 'ok ' : 'NO '} ${name.padEnd(18)} melody not known; should complete neither scale`);
    console.log(`    ${''.padEnd(18)} as the scale up: ${describe(SCALE_UP, up)}`);
    console.log(`    ${''.padEnd(18)} as the scale down: ${describe(SCALE_DOWN, down)}`);
    return ok;
  }
  console.log(`    ${name.padEnd(18)} not a known take (up, down, do-mi-sol, offkey): skipped`);
  return true;
}

if (import.meta.main) {
  const j = JUDGE;
  console.log(`Judge: each step the right way, from ${j.least} of its size to ${j.most} cents past it (or half its size, for a leap), in any octave, held ${j.hold} s in all (pauses up to ${j.gap} s), above level ${j.gate}; a try ends after ${j.silence} s of silence.`);
  console.log('Each take as sung, its first note taken as do: each step sung, in cents (! one that does not count), then what the judge finds.\n');
  const takes = existsSync('tuning') ? readdirSync('tuning').filter((f) => AUDIO.test(f)).sort() : [];
  if (!takes.length) console.log('No recordings in tuning/ yet (docs/planning/blocks/2-your-turn.md says how to make them).');
  const relabel = process.argv.includes('--label');
  const labels = relabel ? {} : readLabels();
  const made: Label[] = [];
  let good = 0;
  for (const f of takes) if (report(join('tuning', f), labels, made)) good++;
  if (relabel && takes.length) {
    writeFileSync(LABELS, JSON.stringify({ about: LABELS_ABOUT, takes: made }, null, 2) + '\n');
    console.log(`\nWrote ${LABELS}.`);
  }
  if (takes.length) console.log(`\n${good} of ${takes.length} as they should be.`);
}
