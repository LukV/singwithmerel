import type { Sound } from './wav.ts';

/**
 * The pitch of a sung clip, and how far it is from its note. The clip is cut into short frames;
 * each frame's pitch comes from YIN (de Cheveigné and Kawahara, 2002); the clip's pitch is the
 * median over the steady middle of the sound, so the consonant and the fade do not count.
 */

const FRAME = 2048;
const HOP = 512;
const THRESHOLD = 0.12;

/** One frame's frequency in Hz, or null if it has no clear pitch. */
function yin(x: Float32Array, start: number, rate: number, minHz: number, maxHz: number): number | null {
  const maxLag = Math.min(Math.floor(rate / minHz), FRAME / 2);
  const minLag = Math.max(2, Math.floor(rate / maxHz));
  const d = new Float32Array(maxLag + 1);
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < FRAME - maxLag; i++) {
      const diff = x[start + i]! - x[start + i + lag]!;
      sum += diff * diff;
    }
    d[lag] = sum;
  }
  // Cumulative mean normalised difference; the first dip under the threshold is the period.
  let running = 0;
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  for (let lag = 1; lag <= maxLag; lag++) {
    running += d[lag]!;
    cmnd[lag] = running === 0 ? 1 : (d[lag]! * lag) / running;
  }
  for (let lag = minLag; lag < maxLag; lag++) {
    if (cmnd[lag]! < THRESHOLD) {
      while (lag + 1 < maxLag && cmnd[lag + 1]! < cmnd[lag]!) lag++;
      // Parabolic interpolation between the neighbours, for a period finer than one sample.
      const a = cmnd[lag - 1]!;
      const b = cmnd[lag]!;
      const c = cmnd[lag + 1]!;
      const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
      return rate / (lag + (Number.isFinite(shift) ? shift : 0));
    }
  }
  return null;
}

const rms = (x: Float32Array, start: number) => {
  let sum = 0;
  for (let i = start; i < start + FRAME; i++) sum += x[i]! * x[i]!;
  return Math.sqrt(sum / FRAME);
};

export interface Measure {
  /** The clip's pitch in Hz, or null if no steady pitch was found. */
  hz: number | null;
  /** When the sound starts, in seconds from the start of the file. */
  onset: number;
}

export function measure({ rate, samples }: Sound, around: number): Measure {
  const frames: { start: number; level: number }[] = [];
  for (let start = 0; start + FRAME <= samples.length; start += HOP) frames.push({ start, level: rms(samples, start) });
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
    .map((f) => yin(samples, f.start, rate, around / 1.6, around * 1.6))
    .filter((hz): hz is number => hz !== null)
    .sort((a, b) => a - b);
  if (pitches.length < Math.max(3, middle.length / 2)) return { hz: null, onset };
  return { hz: pitches[Math.floor(pitches.length / 2)]!, onset };
}

/** How far `hz` is from `target`, in cents (a hundredth of a semitone). */
export const cents = (hz: number, target: number) => 1200 * Math.log2(hz / target);
