import { signal } from '@preact/signals';
import type { Melody } from '../melody/melody';
import { SCALE } from '../melody/scale';
import { centsOf, fold, JUDGE, judgeFor, reach, stepOf, type Judge } from './judge';
import { openMic, type Mic, type MicTrouble } from './mic';
import type { Frame } from './tracker';

/**
 * Merel listening during Your turn: the answer to his ask, remembered on the device; the
 * microphone open for one Your turn at a time; the voice for the dot on the staff.
 */

export type MicChoice = 'yes' | 'no' | null;
const KEY = 'merel.mic';

function readChoice(): MicChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'yes' || v === 'no' ? v : null;
  } catch {
    return null;
  }
}

/** The answer to "Let him listen": asked once, then remembered. */
export const micChoice = signal<MicChoice>(typeof window === 'undefined' ? null : readChoice());

export function setMicChoice(choice: MicChoice): void {
  micChoice.value = choice;
  try {
    if (choice) localStorage.setItem(KEY, choice);
    else localStorage.removeItem(KEY);
  } catch {
    // private mode: remembered for this visit only
  }
}

/**
 * Your voice now, calmed, as if your do were Merel's C (cents above C4): so the dot sits on the
 * staff where the judge hears you. Before the first note sets the key, it sits on that note.
 * Null when you are silent or Merel is not listening.
 */
export const voice = signal<number | null>(null);

/** Merel's last note may still ring when Your turn starts, or after Hear it: listening starts a moment later. */
const SETTLE = 0.25;
/** A key pressed during Your turn: its piano note does not count as your voice for this long. */
const KEY_RING = 2;
/** Frames to take the median of, for the dot. */
const CALM = 5;
/** Silence this long (seconds) and the dot fades. */
const FADE = 0.15;

interface Session {
  mic: Mic;
  judge: Judge;
  from: number | null;
  recent: number[];
  lastVoiced: number;
}

let session: Session | null = null;
let opening = 0;
let keyMute: { cents: number; until: number } | null = null;

/** The piano note of `step` was just played: do not take it for the voice. */
export function muteKey(step: number): void {
  const note = SCALE[step];
  if (note && session) keyMute = { cents: centsOf(note.freq), until: performance.now() / 1000 + KEY_RING };
}

/**
 * Opens the microphone and judges `melody` (judge.ts). `onSung` is called for each note found,
 * `onWrong` for a wrong note held, `onMissed` when a long silence ends a try; `quiet()` says when to
 * hear nothing (Merel is singing). Resolves false if the microphone could not be opened, or
 * listening was stopped meanwhile.
 */
export async function listen(melody: Melody, onSung: () => void, onWrong: () => void, onMissed: () => void, quiet: () => boolean): Promise<boolean> {
  stopListening();
  const mine = ++opening;
  const judge = judgeFor(melody);
  const first = centsOf(SCALE[melody[0]!.step]!.freq);
  const mic = await openMic((frame) => hear(frame));
  if (typeof mic === 'string') return false;
  if (mine !== opening) {
    mic.close();
    return false;
  }
  session = { mic, judge, from: null, recent: [], lastVoiced: 0 };

  function hear(frame: Frame): void {
    const s = session;
    if (!s || mine !== opening) return;
    s.from ??= frame.time + SETTLE;
    const voiced = frame.hz !== null && frame.level >= JUDGE.gate;
    const c = voiced ? centsOf(frame.hz!) : null;
    const now = performance.now() / 1000;
    const piano = c !== null && keyMute && now < keyMute.until && Math.abs(fold(c - keyMute.cents)) < JUDGE.steady;
    // While Merel sings (Hear it), and a moment after, his voice is not yours, and you sing from do after.
    const merel = quiet();
    if (merel) s.from = frame.time + SETTLE;
    if (frame.time < s.from || piano) {
      // Nothing heard while Merel sings, or a key rings, counts, not even as a pause.
      if (merel) s.judge.restart();
      else s.judge.rest();
      calm(s, null, frame.time);
      if (import.meta.env.DEV) devLog(frame, melody, s.judge, null, piano ? 'key rings' : 'Merel');
      return;
    }
    const wants = s.judge.found;
    const event = s.judge.hear(frame);
    if (import.meta.env.DEV) devLog(frame, melody, s.judge, event, null, wants);
    const key = s.judge.key;
    calm(s, c === null ? null : key === null ? first : c - key, frame.time);
    if (event?.type === 'found') onSung();
    else if (event?.type === 'wrong') onWrong();
    else if (event?.type === 'miss') onMissed();
  }
  return true;
}

const NOTE_NAMES = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do'];
const LETTERS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const letter = (hz: number) => {
  const m = Math.round(12 * Math.log2(hz / 440) + 69);
  return `${LETTERS[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
};
let devLines: string[] = [];

/**
 * The dev listening log (`npm run dev` only; the built site has none): every frame, what was
 * heard and what the judge wants, kept in `window.merelLog`; on each note found, wrong note or
 * miss, a line in the console, and on a wrong note or a miss the last three seconds of frames.
 */
function devLog(frame: Frame, melody: Melody, judge: Judge, event: ReturnType<Judge['hear']>, skipped: string | null, wants = judge.found): void {
  const f = (n: number, d = 3) => n.toFixed(d);
  const heard = frame.hz === null ? `no pitch (dip ${f(frame.dip ?? 1, 2)} at ${Math.round(frame.dipHz ?? 0)} Hz)` : `${f(frame.hz, 1)} Hz ${letter(frame.hz)} clarity ${f(frame.clarity, 2)}`;
  let want = 'done';
  if (wants < melody.length) {
    const name = NOTE_NAMES[melody[wants]!.step]!;
    const last = judge.last;
    if (last === null || wants === 0) want = `${name} (first note: any pitch)`;
    else {
      const size = stepOf(melody, wants);
      const { low, high } = reach(size);
      const from = SCALE[0]!.freq * 2 ** (last / 1200);
      want = `${name} (${f(low, 0)} to ${f(high, 0)} cents ${size > 0 ? 'up' : 'down'} from ${f(from, 1)} Hz ${letter(from)})`;
    }
  }
  const quiet = frame.level < JUDGE.gate ? ' QUIET' : '';
  const line = `${f(frame.time, 2)}s level ${f(frame.level, 4)}${quiet} ${heard} | wants ${want}${skipped ? ` | skipped: ${skipped}` : ''}${event ? ` | ${event.type === 'found' ? `FOUND ${NOTE_NAMES[melody[event.index]!.step]}` : event.type === 'wrong' ? 'WRONG NOTE' : 'MISS (silence)'}` : ''}`;
  devLines.push(line);
  if (devLines.length > 3000) devLines = devLines.slice(-2000);
  (globalThis as { merelLog?: string[] }).merelLog = devLines;
  if (event?.type === 'found') console.log(`[merel] found ${NOTE_NAMES[melody[event.index]!.step]} (${event.index + 1}/${melody.length}) at ${f(frame.time, 2)}s; do now at ${f(judge.key ?? 0, 0)} cents from C`);
  if (event && event.type !== 'found')
    console.log(`[merel] ${event.type === 'wrong' ? 'wrong note' : 'miss (silence)'} at ${f(frame.time, 2)}s, waiting for ${want}. Last 3 s:\n${devLines.slice(-300).join('\n')}`);
}

function calm(s: Session, c: number | null, time: number): void {
  if (c === null) {
    if (time - s.lastVoiced > FADE) {
      s.recent.length = 0;
      if (voice.value !== null) voice.value = null;
    }
    return;
  }
  s.lastVoiced = time;
  s.recent.push(c);
  if (s.recent.length > CALM) s.recent.shift();
  const sorted = [...s.recent].sort((a, b) => a - b);
  voice.value = sorted[Math.floor(sorted.length / 2)]!;
}

export function stopListening(): void {
  opening++;
  session?.mic.close();
  session = null;
  keyMute = null;
  voice.value = null;
}

/** Asks the browser for the microphone and closes it at once: "Let Merel listen" on a card. */
export async function askMic(): Promise<'ok' | MicTrouble> {
  const mic = await openMic(() => undefined);
  if (typeof mic === 'string') return mic;
  mic.close();
  return 'ok';
}
