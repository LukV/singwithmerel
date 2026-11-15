import type { Melody } from '../melody/melody';
import { SCALE } from '../melody/scale.ts';
import type { Frame } from './tracker';
import { cents } from './yin.ts';

/**
 * What Merel counts as a sung note, from a pitch track. Behind one function, `listenFor`, so the
 * rule can change without touching the round: for now any steady tone counts, one per note of the
 * melody, in order (pitch 2.1); the mild judge of pitch 2.2 takes its place.
 */

/** The numbers Merel listens with, in one place. */
export const LISTEN = {
  /** A frame quieter than this (root mean square) is silence. */
  gate: 0.01,
  /** A steady tone stays within this many cents of its own average: a quarter tone. */
  steady: 50,
  /** How long, in seconds, a tone must stay steady to count. */
  hold: 0.3,
  /** A gap this short (seconds), or one stray frame, does not break a tone. */
  gap: 0.08,
};

export type Listen = typeof LISTEN;

export type EarEvent = { type: 'found'; index: number };

export interface Ear {
  /** Feed one frame; returns what it made Merel hear, if anything. */
  hear(frame: Frame): EarEvent | null;
  /** How many notes of the melody are found so far. */
  readonly found: number;
}

const C4 = SCALE[0]!.freq;

/** Cents above C4. */
export const centsOf = (hz: number) => cents(hz, C4);

/** `c` folded into -600..600 cents: the same note in any octave is 0 apart. */
export const fold = (c: number) => ((((c + 600) % 1200) + 1200) % 1200) - 600;

interface Tone {
  anchor: number;
  /** Sum of the frames' folded distances to the anchor, and how many. */
  sum: number;
  n: number;
  start: number;
  last: number;
  counted: boolean;
  /** Whether the last frame strayed. */
  strayed: boolean;
}

export function listenFor(melody: Melody, settings: Listen = LISTEN): Ear {
  let tone: Tone | null = null;
  let found = 0;

  const begin = (c: number, time: number): Tone => ({ anchor: c, sum: 0, n: 1, start: time, last: time, counted: false, strayed: false });

  return {
    get found() {
      return found;
    },
    hear(frame) {
      const voiced = frame.hz !== null && frame.level >= settings.gate;
      if (!voiced) {
        if (tone && frame.time - tone.last > settings.gap) tone = null;
        return null;
      }
      const c = centsOf(frame.hz!);
      if (!tone) tone = begin(c, frame.time);
      else {
        const d = fold(c - tone.anchor);
        if (Math.abs(d - tone.sum / tone.n) <= settings.steady) {
          tone.sum += d;
          tone.n++;
          tone.last = frame.time;
          tone.strayed = false;
        } else if (!tone.strayed && frame.time - tone.last <= settings.gap) {
          tone.strayed = true; // one stray frame, an octave slip of the detector, say
          return null;
        } else tone = begin(c, frame.time);
      }
      if (tone.counted || tone.last - tone.start < settings.hold || found >= melody.length) return null;
      tone.counted = true;
      return { type: 'found', index: found++ };
    },
  };
}
