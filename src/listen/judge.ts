import type { Melody } from '../melody/melody';
import { SCALE } from '../melody/scale.ts';
import type { Frame } from './tracker';
import { cents } from './yin.ts';

/**
 * The mild judge: which notes of the melody you have found, from a pitch track. It judges the
 * step, not the note (docs/architecture/decisions/017-judge-the-step.md). The first steady note of
 * a try, held long enough, is the melody's first note, wherever you sing it. Each note after counts
 * when you move from the note found last the right way (up or down) by roughly the right amount:
 * from half the step to well past it. A whole step sung as a half step, a half step sung as a
 * whole one, a third sung as a fourth: all count; the wrong way, or standing still, does not. An
 * octave either way is the same note. A wrong note does not count and resets nothing: you try the
 * step again. Only a long silence ends a try, and you start again from do. Notes in order; rhythm
 * and timing are not judged. Tuned on a child, a woman and a man (`npm run tune`).
 */

/** The numbers Merel judges with, in one place. */
export const JUDGE = {
  /**
   * A frame quieter than this (root mean square) is silence; a frame with no clear pitch is too.
   * The recordings sing around 0.05, through a phone's automatic gain; a laptop's raw microphone
   * hears a voice 3 to 7 times quieter. 0.01 lost most notes at that level; 0.002 finds them all.
   */
  gate: 0.002,
  /**
   * How long, in seconds, you must stay on the note for it to count, in all. 0.3 s missed the
   * short notes of untrained singers (some last 0.25 s); 0.2 s finds them all.
   */
  hold: 0.2,
  /**
   * A pause this short (seconds), or frames off the note for as long, does not break holding it:
   * a wobble or a scoop. 0.08 s lost the man's notes; 0.15 s keeps them.
   */
  gap: 0.15,
  /** Silence this long (seconds) after singing ends a try: you start again from do. A breath, or a moment to think, is shorter. */
  silence: 3,
  /** A tone that counts as one note sung stays within this many cents of its own average. */
  steady: 50,
  /** The first note, which sets where you start, stays within this many cents of the median of its last frames: a wobble is fine. */
  first: 60,
  /** A step counts from this share of its size, the right way: a whole step from 100 cents, a half step from 50. */
  least: 0.5,
  /** A step counts up to this many cents past its size, or half its size past it for a leap, whichever is more. */
  most: 200,
  /** Within this many cents of the note found last (and nearer to it than to the next), you are still on it, or singing it again. */
  stay: 100,
};

export type Judging = typeof JUDGE;

/**
 * What a frame made Merel hear: a note found; a wrong note held, which resets nothing; or a miss,
 * a long silence, which starts the try again from do.
 */
export type JudgeEvent = { type: 'found'; index: number } | { type: 'wrong' } | { type: 'miss' };

export interface Judge {
  /** Feed one frame; returns what it made Merel hear, if anything. */
  hear(frame: Frame): JudgeEvent | null;
  /** A key rings, or listening has not started: what you sang before is not one tone with what comes after. */
  rest(): void;
  /** Merel sang the melody again (Hear it): the try starts again from do. */
  restart(): void;
  /** How many notes of the melody are found so far. */
  readonly found: number;
  /** Where the note found last was sung, in cents above C4; null before the first note. */
  readonly last: number | null;
  /** Where your do is, from the note found last, in cents above C, folded into -600..600; null before the first note. */
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

/** The step from note `index - 1` to note `index` of `melody`, in cents (up is positive). */
export const stepOf = (melody: Melody, index: number) => (SEMITONES[melody[index]!.step]! - SEMITONES[melody[index - 1]!.step]!) * 100;

/** How far, in cents, a step of `size` may go and still count: from `low` to `high`, the right way. */
export function reach(size: number, settings: Judging = JUDGE): { low: number; high: number } {
  const s = Math.abs(size);
  return { low: settings.least * s, high: s + Math.max(settings.most, s / 2) };
}

/** Whether moving `moved` cents counts as the step `size`, in any octave. */
export function counts(moved: number, size: number, settings: Judging = JUDGE): boolean {
  const { low, high } = reach(size, settings);
  return [-1200, 0, 1200].some((octave) => {
    const d = moved + octave;
    return Math.sign(d) === Math.sign(size) && Math.abs(d) >= low && Math.abs(d) <= high;
  });
}

interface Hold {
  /** Seconds spent on the step, and the last frame that was. */
  held: number;
  last: number;
  cents: number[];
}

/** A steady tone, of any pitch: what counts as one note sung, to tell a wrong note held. */
interface Tone {
  anchor: number;
  sum: number;
  n: number;
  start: number;
  last: number;
  /** It was on a note: the one found last, or the step to the next. A tone that never was is a wrong note. */
  used: boolean;
}

export function judgeFor(melody: Melody, settings: Judging = JUDGE, from = 0): Judge {
  let found = Math.min(from, melody.length);
  /** Where the note found last was sung (the median of its frames); starting further on (a test), at its place in C. */
  let last: number | null = found > 0 ? SEMITONES[melody[found - 1]!.step]! * 100 : null;
  let hold: Hold | null = null;
  let tone: Tone | null = null;
  /** The first note while it is held, before it is found: its pitches, how long, and the last frame. */
  let opening: { cents: number[]; held: number; last: number } | null = null;
  /**
   * The note found last, while you stay on it, or sing it again after a pause: it goes on setting
   * where the next step starts, so the scoop into it weighs less than where it settles.
   */
  let on: { cents: number[]; last: number } | null = null;
  /** The note found last, sung again after a pause, while it is held: it becomes where the next step starts once held long enough. */
  let again: Hold | null = null;
  let previous: number | null = null;
  /** This try: whether you have sung, and when last. */
  let sang = false;
  let lastVoiced = 0;

  function newTone(): void {
    hold = null;
    again = null;
    tone = null;
    opening = null;
  }

  function restart(): void {
    found = 0;
    last = null;
    on = null;
    sang = false;
    newTone();
  }

  /** The tone ends: held but on no note, it was a wrong note. */
  function endTone(): boolean {
    const t = tone;
    tone = null;
    return !!t && !t.used && t.last - t.start >= settings.hold;
  }

  /** Follows the steady tone the frame belongs to; true when a wrong note just ended. */
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
      const wrong = endTone();
      tone = { anchor: c, sum: 0, n: 1, start: time, last: time, used: false };
      return wrong;
    }
    tone = { anchor: c, sum: 0, n: 1, start: time, last: time, used: false };
    return false;
  }

  /** The next note is found, sung at `cents`. */
  function foundNote(cents: number[], time: number): JudgeEvent {
    const index = found++;
    opening = null;
    hold = null;
    again = null;
    on = { cents: [...cents], last: time };
    last = median(on.cents);
    if (tone) tone.used = true;
    return { type: 'found', index };
  }

  /**
   * Still on the note found last, or on it again: within `stay` of it, and nearer to it than to the
   * next step (half way is the step's). To the same note in another octave, a pause is needed.
   */
  const near = (c: number) => {
    const d = fold(c - last!);
    const to = fold(c - last! - stepOf(melody, found));
    return Math.abs(d) < settings.stay && (Math.abs(d) < Math.abs(to) || (to === d && Math.abs(d) < settings.stay));
  };

  return {
    get found() {
      return found;
    },
    get last() {
      return last;
    },
    get key() {
      return last === null ? null : fold(last - SEMITONES[melody[found - 1]!.step]! * 100);
    },
    rest() {
      sang = false;
      newTone();
    },
    restart,
    hear(frame) {
      if (found >= melody.length) return null;
      const voiced = frame.hz !== null && frame.level >= settings.gate;
      const time = frame.time;
      // How long this frame stands for: the time since the last one, two frames at most.
      const step = previous === null ? 0.01 : Math.min(time - previous, 0.02);
      previous = time;
      if (!voiced) {
        if (hold && time - hold.last > settings.gap) hold = null;
        if (tone && time - tone.last > settings.gap && endTone()) return { type: 'wrong' };
        if (sang && time - lastVoiced >= settings.silence) {
          restart();
          return { type: 'miss' };
        }
        return null;
      }
      const c = centsOf(frame.hz!);
      sang = true;
      lastVoiced = time;
      const wrong = follow(c, time);
      if (last === null) {
        // The first note: any pitch held long enough, wherever it is. It may wander while it is
        // held (a scoop, a wobble).
        if (tone) tone.used = true;
        const o = opening;
        if (o && time - o.last <= settings.gap && Math.abs(fold(c - median(o.cents.slice(-8)))) <= settings.first) {
          o.cents.push(c);
          o.held += step;
          o.last = time;
        } else opening = { cents: [c], held: step, last: time };
        if (opening!.held < settings.hold) return wrong ? { type: 'wrong' } : null;
        return foundNote(opening!.cents, time);
      }
      const size = stepOf(melody, found);
      const moved = c - last;
      // Right after a note, you are on it while you stay near it; after a pause, a step counts first.
      const still = on !== null && time - on.last <= settings.gap && near(c);
      if (!still && counts(moved, size, settings)) {
        if (tone) tone.used = true;
        on = null;
        again = null;
        if (!hold || time - hold.last > settings.gap) hold = { held: step, last: time, cents: [c] };
        else {
          hold.held += step;
          hold.last = time;
          hold.cents.push(c);
        }
        if (hold.held >= settings.hold) return foundNote(hold.cents, time);
      } else if (near(c)) {
        if (tone) tone.used = true;
        if (still) {
          // Still on the note found last: where it settles is where the next step starts.
          on!.cents.push(c);
          on!.last = time;
          last = median(on!.cents);
        } else if (!hold || time - hold.last > settings.gap) {
          // Singing the note found last again, after a pause: held long enough, the next step starts from it.
          on = null;
          if (!again || time - again.last > settings.gap) again = { held: step, last: time, cents: [c] };
          else {
            again.held += step;
            again.last = time;
            again.cents.push(c);
          }
          if (again.held >= settings.hold) {
            on = { cents: again.cents, last: time };
            last = median(on.cents);
            again = null;
          }
        }
      }
      return wrong ? { type: 'wrong' } : null;
    },
  };
}
