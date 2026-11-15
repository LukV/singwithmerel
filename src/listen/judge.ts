import type { Melody } from '../melody/melody';
import { SCALE } from '../melody/scale.ts';
import type { Frame } from './tracker';
import { cents } from './yin.ts';

/**
 * The mild judge: which notes of the melody you have found, from a pitch track. Each pitch is
 * folded into one octave and compared with the next note not yet found, in Merel's key (do is C):
 * close enough and held long enough, that note is found and the judge waits for the next. Notes
 * in order; rhythm and timing are not judged. A try ends in a miss when you hold a wrong note
 * (off key) or stop singing before all are found; you start again from do, as a teacher would
 * have you. Tuned on a child, a woman and a man (`npm run tune`, pitch 2.2).
 */

/** The numbers Merel judges with, in one place. */
export const JUDGE = {
  /**
   * A frame quieter than this (root mean square) is silence; a frame with no clear pitch is too.
   * The recordings sing around 0.05, through a phone's automatic gain; a laptop's raw microphone
   * hears a voice 3 to 7 times quieter. 0.01 lost most notes at that level; 0.002 finds them all.
   */
  gate: 0.002,
  /** How far from the note, in cents, folded into one octave, still counts: less than a semitone. */
  tolerance: 100,
  /**
   * How long, in seconds, you must stay close to the note for it to count, in all. 0.3 s missed
   * the short notes of untrained singers (some last 0.25 s); 0.2 s finds them all.
   */
  hold: 0.2,
  /**
   * A pause this short (seconds), or frames off the note for as long, does not break holding it:
   * a wobble or a scoop. 0.08 s lost the man's notes; 0.15 s keeps them.
   */
  gap: 0.15,
  /** Silence this long (seconds) after singing ends a try. */
  silence: 1.5,
  /** A tone that counts as sung but missed stays within this many cents of its own average. */
  steady: 50,
  /** Steady tones held that found nothing, in one try, before it ends: off key. */
  strikes: 1,
};

export type Judging = typeof JUDGE;

export type JudgeEvent = { type: 'found'; index: number } | { type: 'miss' };

export interface Judge {
  /** Feed one frame; returns what it made Merel hear, if anything. */
  hear(frame: Frame): JudgeEvent | null;
  /** Merel is singing, or listening has not started: the try starts afresh after this. */
  rest(): void;
  /** How many notes of the melody are found so far. */
  readonly found: number;
}

const C4 = SCALE[0]!.freq;

/** Cents above C4. */
export const centsOf = (hz: number) => cents(hz, C4);

/** `c` folded into -600..600 cents: the same note in any octave is 0 apart. */
export const fold = (c: number) => ((((c + 600) % 1200) + 1200) % 1200) - 600;

/** Semitones above C4 of each scale step. */
const SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12];

interface Hold {
  /** Seconds spent close to the note, and the last frame that was. */
  held: number;
  last: number;
}

/** A steady tone, of any pitch: what counts as one note sung, for "sang on past the melody". */
interface Tone {
  anchor: number;
  sum: number;
  n: number;
  start: number;
  last: number;
  /** A note was found while it sounded. */
  used: boolean;
}

export function judgeFor(melody: Melody, settings: Judging = JUDGE, from = 0): Judge {
  let found = Math.min(from, melody.length);
  let hold: Hold | null = null;
  /**
   * The note just found: the next counts only once you move nearer to it than to this one, or
   * pause, so one long tone between two neighbours is not both. High do, then low do, needs a pause.
   */
  let leave: number | null = null;
  let tone: Tone | null = null;
  let previous: number | null = null;
  /** This try: whether you have sung, when last, and how many tones missed. */
  let sang = false;
  let lastVoiced = 0;
  let missed = 0;

  const target = () => SEMITONES[melody[found]!.step]! * 100;
  const close = (c: number, t: number) => Math.abs(fold(c - t)) < settings.tolerance;

  function newTry(): void {
    sang = false;
    missed = 0;
    hold = null;
    tone = null;
  }

  /** A try ends before the melody does: you start again from do. */
  function miss(): JudgeEvent {
    found = 0;
    leave = null;
    newTry();
    return { type: 'miss' };
  }

  /** The tone ends: held but no note found during it, it was sung and missed. */
  function endTone(): boolean {
    const t = tone;
    tone = null;
    if (!t || t.used || t.last - t.start < settings.hold) return false;
    return ++missed >= settings.strikes;
  }

  function follow(c: number, time: number): boolean {
    if (tone) {
      const d = fold(c - tone.anchor);
      if (Math.abs(d - tone.sum / tone.n) <= settings.steady) {
        tone.sum += d;
        tone.n++;
        tone.last = time;
        return false;
      }
      if (time - tone.last <= settings.gap) return false;
      if (endTone()) return true;
    }
    tone = { anchor: c, sum: 0, n: 1, start: time, last: time, used: false };
    return false;
  }

  return {
    get found() {
      return found;
    },
    rest() {
      newTry();
    },
    hear(frame) {
      if (found >= melody.length) return null;
      const voiced = frame.hz !== null && frame.level >= settings.gate;
      const time = frame.time;
      // How long this frame stands for: the time since the last one, two frames at most.
      const step = previous === null ? 0.01 : Math.min(time - previous, 0.02);
      previous = time;
      if (!voiced) {
        if (hold && time - hold.last > settings.gap) hold = null;
        if (tone && time - tone.last > settings.gap && endTone()) return miss();
        if (leave !== null && time - lastVoiced > settings.gap) leave = null;
        if (sang && time - lastVoiced >= settings.silence) return miss();
        return null;
      }
      const c = centsOf(frame.hz!);
      sang = true;
      lastVoiced = time;
      if (follow(c, time)) return miss();
      const t = target();
      if (leave !== null) {
        if (Math.abs(fold(c - t)) >= Math.abs(fold(c - leave))) return null;
        leave = null;
      }
      if (close(c, t)) {
        if (!hold || time - hold.last > settings.gap) hold = { held: step, last: time };
        else {
          hold.held += step;
          hold.last = time;
        }
      }
      if (!hold || hold.held < settings.hold) return null;
      const index = found++;
      hold = null;
      if (tone) tone.used = true;
      if (found < melody.length) leave = t;
      return { type: 'found', index };
    },
  };
}
