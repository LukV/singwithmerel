/**
 * YIN pitch detection (de Cheveigné and Kawahara, 2002), pure and shared: the app listens with it
 * in an AudioWorklet (pitch-worklet.ts), and `npm run voice` and `npm run tune` measure files with it.
 * Settings and why: docs/architecture/decisions/015-pitch-detector.md.
 */

/** Below this, a dip of the normalised difference counts as the period. */
export const THRESHOLD = 0.12;

export interface Pitch {
  hz: number;
  /** 1 minus the depth of the dip: near 1 for a clean tone, lower for a breathy or noisy one. */
  clarity: number;
}

/**
 * The pitch of `length` samples of `x` from `start`, between `minHz` and `maxHz`, or null if it
 * has no clear pitch. The difference is summed over `length` minus the longest period, so the
 * frame must hold at least about two periods of the lowest pitch.
 */
/** The deepest dip found, clear or not: what the dev listening log shows for a frame with no pitch. */
export interface Dip {
  hz: number;
  depth: number;
}

export function yin(x: ArrayLike<number>, start: number, length: number, rate: number, minHz: number, maxHz: number, threshold = THRESHOLD, deepest?: Dip): Pitch | null {
  const maxLag = Math.min(Math.floor(rate / minHz), Math.floor(length / 2));
  const minLag = Math.max(2, Math.floor(rate / maxHz));
  const window = length - maxLag;
  if (maxLag <= minLag + 1 || window <= 0) return null;
  // Cumulative mean normalised difference; the first dip under the threshold is the period.
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = start, end = start + window; i < end; i++) {
      const diff = x[i]! - x[i + lag]!;
      sum += diff * diff;
    }
    running += sum;
    cmnd[lag] = running === 0 ? 1 : (sum * lag) / running;
  }
  if (deepest) {
    let best = minLag;
    for (let lag = minLag; lag < maxLag; lag++) if (cmnd[lag]! < cmnd[best]!) best = lag;
    deepest.hz = rate / best;
    deepest.depth = cmnd[best]!;
  }
  for (let lag = minLag; lag < maxLag; lag++) {
    if (cmnd[lag]! < threshold) {
      while (lag + 1 < maxLag && cmnd[lag + 1]! < cmnd[lag]!) lag++;
      // Parabolic interpolation between the neighbours, for a period finer than one sample.
      const a = cmnd[lag - 1]!;
      const b = cmnd[lag]!;
      const c = cmnd[lag + 1]!;
      const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
      const period = lag + (Number.isFinite(shift) && Math.abs(shift) < 1 ? shift : 0);
      return { hz: rate / period, clarity: 1 - b };
    }
  }
  return null;
}

/** The root mean square of `length` samples from `start`: 1 is a full-scale square wave. */
export function rms(x: ArrayLike<number>, start: number, length: number): number {
  let sum = 0;
  for (let i = start; i < start + length; i++) sum += x[i]! * x[i]!;
  return Math.sqrt(sum / length);
}

/** How far `hz` is from `target`, in cents (a hundredth of a semitone). */
export const cents = (hz: number, target: number) => 1200 * Math.log2(hz / target);
