import { signal } from '@preact/signals';
import type { Melody } from '../melody/melody';
import { SCALE } from '../melody/scale';
import { centsOf, fold, LISTEN, listenFor, type Ear } from './ear';
import { openMic, type Mic } from './mic';
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
export const micChoice = signal<MicChoice>(typeof localStorage === 'undefined' ? null : readChoice());

export function setMicChoice(choice: MicChoice): void {
  micChoice.value = choice;
  try {
    if (choice) localStorage.setItem(KEY, choice);
    else localStorage.removeItem(KEY);
  } catch {
    // private mode: remembered for this visit only
  }
}

/** Your voice now, in cents above C4, calmed; null when you are silent or Merel is not listening. */
export const voice = signal<number | null>(null);

/** Merel's last note may still ring when Your turn starts: listening starts a moment later. */
const SETTLE = 0.25;
/** A key pressed during Your turn: its piano note does not count as your voice for this long. */
const KEY_RING = 2;
/** Frames to take the median of, for the dot. */
const CALM = 5;
/** Silence this long (seconds) and the dot fades. */
const FADE = 0.15;

interface Session {
  mic: Mic;
  ear: Ear;
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
 * Opens the microphone and listens for `melody`. `onSung` is called for each note heard;
 * `quiet()` says when to hear nothing (Merel is singing). Resolves false if the microphone
 * could not be opened, or listening was stopped meanwhile.
 */
export async function listen(melody: Melody, onSung: () => void, quiet: () => boolean): Promise<boolean> {
  stopListening();
  const mine = ++opening;
  const ear = listenFor(melody);
  const mic = await openMic((frame) => hear(frame));
  if (!mic) return false;
  if (mine !== opening) {
    mic.close();
    return false;
  }
  session = { mic, ear, from: null, recent: [], lastVoiced: 0 };

  function hear(frame: Frame): void {
    const s = session;
    if (!s || mine !== opening) return;
    s.from ??= frame.time + SETTLE;
    const voiced = frame.hz !== null && frame.level >= LISTEN.gate;
    const c = voiced ? centsOf(frame.hz!) : null;
    const now = performance.now() / 1000;
    const piano = c !== null && keyMute && now < keyMute.until && Math.abs(fold(c - keyMute.cents)) < LISTEN.steady;
    if (frame.time < s.from || quiet() || piano) {
      calm(s, null, frame.time);
      return;
    }
    calm(s, c, frame.time);
    if (s.ear.hear(frame)) onSung();
  }
  return true;
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
export async function askMic(): Promise<boolean> {
  const mic = await openMic(() => undefined);
  mic?.close();
  return !!mic;
}
