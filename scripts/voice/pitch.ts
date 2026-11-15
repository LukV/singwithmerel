import { rms as level, yin } from '../../src/listen/yin.ts';
import type { Sound } from './wav.ts';

/**
 * The pitch of a sung clip, and how far it is from its note. The clip is cut into short frames;
 * each frame's pitch comes from YIN (src/listen/yin.ts), as the app hears it; the clip's pitch is the
 * median over the steady middle of the sound, so the consonant and the fade do not count.
 */

const FRAME = 2048;
const HOP = 512;

export interface Measure {
  /** The clip's pitch in Hz, or null if no steady pitch was found. */
  hz: number | null;
  /** When the sound starts, in seconds from the start of the file. */
  onset: number;
}

export function measure({ rate, samples }: Sound, around: number): Measure {
  const frames: { start: number; level: number }[] = [];
  for (let start = 0; start + FRAME <= samples.length; start += HOP) frames.push({ start, level: level(samples, start, FRAME) });
  const loudest = Math.max(0, ...frames.map((f) => f.level));
  // The sound starts at the first sample above 5% of the loudest level, in short steps.
  const floor = loudest * 0.05;
  let onset = 0;
  for (let i = 0; i < samples.length; i += 32) {
    let peak = 0;
    for (let j = i; j < Math.min(i + 32, samples.length); j++) peak = Math.max(peak, Math.abs(samples[j]!));
    if (peak > floor * Math.SQRT2) {
      onset = i / rate;
      break;
    }
  }
  const voiced = frames.filter((f) => f.level > loudest * 0.3);
  if (!voiced.length) return { hz: null, onset };
  // The steady middle: skip the first and last fifth of the voiced frames.
  const cut = Math.floor(voiced.length / 5);
  const middle = voiced.slice(cut, voiced.length - cut || undefined);
  const pitches = middle
    .map((f) => yin(samples, f.start, FRAME, rate, around / 1.6, around * 1.6)?.hz ?? null)
    .filter((hz): hz is number => hz !== null)
    .sort((a, b) => a - b);
  if (pitches.length < Math.max(3, middle.length / 2)) return { hz: null, onset };
  return { hz: pitches[Math.floor(pitches.length / 2)]!, onset };
}

export { cents } from '../../src/listen/yin.ts';
