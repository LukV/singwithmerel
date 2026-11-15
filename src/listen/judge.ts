import type { Melody } from '../melody/melody';
import { SCALE } from '../melody/scale.ts';
import type { Frame } from './tracker';
import { cents } from './yin.ts';

/**
 * The mild judge: which notes of the melody you have found, from a pitch track. Do is movable:
 * the first steady note of a try, held long enough, is the melody's first note, wherever you sing
 * it, and sets the key. Each pitch after is folded into one octave and compared with the next note
 * not yet found, in that key: close enough and held long enough, that note is found. Notes
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
  /**
   * Do follows the notes you sing: it sits where the last this many notes found put it, so each
   * note is judged from the one before. Singing down, voices sink a little each note; an average
   * of every note lags behind, until a flat fa passes for mi. 2 lost a scale 25 cents flatter each
   * note; 1 keeps it.
   */
  follow: 1,
  /** The first note, which sets do, stays within this many cents of the median of its last frames: a wobble is fine. */
  first: 60,
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
  /** Where this try's do is, in cents above C, folded into -600..600; null before its first note. */
  readonly key: number | null;
}

const C4 = SCALE[0]!.freq;

/** Cents above C4. */
export const centsOf = (hz: number) => cents(hz, C4);

/** `c` folded into -600..600 cents: the same note in any octave is 0 apart. */
export const fold = (c: number) => ((((c + 600) % 1200) + 1200) % 1200) - 600;

const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]!;

/** Semitones above C4 of each scale step. */
const SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12];

interface Hold {
  /** Seconds spent close to the note, and the last frame that was; the pitches heard close. */
  held: number;
  last: number;
  cents: number[];
}

/** A steady tone, of any pitch: what counts as one note sung, for "sang on past the melody". */
interface Tone {
  anchor: number;
  sum: number;
  n: number;
  start: number;
  last: number;
  /** It was on a note: the one just found, or close to the next. A tone that never was is a wrong note. */
  used: boolean;
}

export function judgeFor(melody: Melody, settings: Judging = JUDGE, from = 0): Judge {
  let found = Math.min(from, melody.length);
  /** Starting further on (a test), do is C. */
  let key: number | null = found > 0 ? 0 : null;
  let hold: Hold | null = null;
  let tone: Tone | null = null;
  /** The first note while it is held, before it is found: its pitches, how long, and the last frame. */
  let opening: { cents: number[]; held: number; last: number } | null = null;
  /**
   * The note just found, while you stay on it: it goes on setting where do is, so the scoop into
   * it weighs less, and the next note counts only once you move nearer to it than to this one, or
   * pause, so one long tone between two neighbours is not both. High do, then low do, needs a pause.
   */
  let just: { index: number; cents: number[]; last: number; base: number } | null = null;
  /**
   * Where each note found was sung, as do's place it implies: the key is the average of the last
   * few, so do follows a singer who drifts, and a first note sung a bit off does not bend the rest.
   */
  let places: number[] = [];
  let previous: number | null = null;
  /** This try: whether you have sung, when last, and how many tones missed. */
  let sang = false;
  let lastVoiced = 0;
  let missed = 0;

  const semitones = (index: number) => SEMITONES[melody[index]!.step]! * 100;
  const target = () => semitones(found) + (key ?? 0);
  const close = (c: number, t: number) => Math.abs(fold(c - t)) < settings.tolerance;

  function newTry(): void {
    sang = false;
    missed = 0;
    hold = null;
    tone = null;
    opening = null;
  }

  /** A try ends before the melody does: you start again from do. */
  function miss(): JudgeEvent {
    found = 0;
    key = null;
    places = [];
    just = null;
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

  /** Where do is, from the note just found and the ones before it. */
  function place(): void {
    const j = just!;
    places[j.index] = j.base + fold(median(j.cents) - semitones(j.index) - j.base);
    const recent = places.slice(Math.max(0, j.index + 1 - settings.follow), j.index + 1);
    key = recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  /** The next note is found, sung at `cents`, with do at `base` until now. */
  function foundNote(cents: number[], time: number, base: number): JudgeEvent {
    const index = found++;
    opening = null;
    just = found < melody.length ? { index, cents: [...cents], last: time, base } : null;
    if (just) place();
    if (tone) tone.used = true;
    return { type: 'found', index };
  }

  return {
    get found() {
      return found;
    },
    get key() {
      return key;
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
        if (sang && time - lastVoiced >= settings.silence) return miss();
        return null;
      }
      const c = centsOf(frame.hz!);
      sang = true;
      lastVoiced = time;
      if (follow(c, time)) return miss();
      if (key === null) {
        // The first note: any pitch held long enough, wherever it is, sets the key. It may
        // wander while it is held (a scoop, a wobble).
        const o = opening;
        if (o && time - o.last <= settings.gap && Math.abs(fold(c - median(o.cents.slice(-8)))) <= settings.first) {
          o.cents.push(c);
          o.held += step;
          o.last = time;
        } else opening = { cents: [c], held: step, last: time };
        if (opening!.held < settings.hold) return null;
        return foundNote(opening!.cents, time, 0);
      }
      const t = target();
      if (just) {
        // Still on the note just found: nearer to it than to the next, with no pause.
        const on = time - just.last <= settings.gap && Math.abs(fold(c - semitones(just.index) - key)) <= Math.abs(fold(c - t));
        if (on) {
          if (tone) tone.used = true;
          just.cents.push(c);
          just.last = time;
          place();
          return null;
        }
        just = null;
      }
      if (close(c, t)) {
        // Close to the next note: whatever this tone is, it is not a wrong note.
        if (tone) tone.used = true;
        if (!hold || time - hold.last > settings.gap) hold = { held: step, last: time, cents: [c] };
        else {
          hold.held += step;
          hold.last = time;
          hold.cents.push(c);
        }
      }
      if (!hold || hold.held < settings.hold) return null;
      const cents = hold.cents;
      hold = null;
      return foundNote(cents, time, key);
    },
  };
}
