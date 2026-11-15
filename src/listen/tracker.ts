import { rms, yin } from './yin.ts';

/**
 * Turns a stream of samples into a pitch track: a frame of about 43 ms every 10 ms or so, each
 * with its pitch, clarity and level. Pure, so the worklet (pitch-worklet.ts) and `npm run tune`
 * hear the same thing. Settings: docs/architecture/decisions/015-pitch-detector.md.
 */

/** The lowest and highest pitch heard: a low man's voice to a child's high notes. */
export const MIN_HZ = 70;
export const MAX_HZ = 1100;
/** At 44.1 or 48 kHz every second sample is enough for a voice, and halves the work. */
const DECIMATE_FROM = 32_000;
/** Frame and hop, in samples after decimation (about 22 to 24 kHz). */
export const LENGTH = 1024;
export const HOP = 240;

export interface Frame {
  /** Seconds from the first sample, at the end of the frame. */
  time: number;
  /** The pitch, or null when the frame has none. */
  hz: number | null;
  clarity: number;
  /** Root mean square of the frame. */
  level: number;
  /** The deepest dip of the frame, clear or not (YIN's difference, 0 is a perfect period), for the dev log. */
  dip?: number;
  dipHz?: number;
}

export class Tracker {
  readonly rate: number;
  private readonly factor: number;
  private readonly buffer = new Float32Array(LENGTH * 2);
  private filled = 0;
  private sinceHop = 0;
  private pending = 0;
  private pendingCount = 0;
  private seen = 0;
  private readonly inputRate: number;

  constructor(inputRate: number) {
    this.inputRate = inputRate;
    this.factor = inputRate >= DECIMATE_FROM ? 2 : 1;
    this.rate = inputRate / this.factor;
  }

  /** Feed samples; returns the frames completed by them. */
  push(input: ArrayLike<number>): Frame[] {
    const frames: Frame[] = [];
    for (let i = 0; i < input.length; i++) {
      this.seen++;
      this.pending += input[i]!;
      if (++this.pendingCount < this.factor) continue;
      const sample = this.pending / this.factor;
      this.pending = 0;
      this.pendingCount = 0;
      // A buffer twice the frame, slid back when full, keeps each frame in one contiguous run.
      if (this.filled === this.buffer.length) {
        this.buffer.copyWithin(0, LENGTH);
        this.filled = LENGTH;
      }
      this.buffer[this.filled++] = sample;
      if (++this.sinceHop < HOP || this.filled < LENGTH) continue;
      this.sinceHop = 0;
      frames.push(this.frame());
    }
    return frames;
  }

  private frame(): Frame {
    const start = this.filled - LENGTH;
    const level = rms(this.buffer, start, LENGTH);
    const deepest = { hz: 0, depth: 1 };
    const pitch = level > 0 ? yin(this.buffer, start, LENGTH, this.rate, MIN_HZ, MAX_HZ, undefined, deepest) : null;
    return { time: this.seen / this.inputRate, hz: pitch?.hz ?? null, clarity: pitch?.clarity ?? 0, level, dip: deepest.depth, dipHz: deepest.hz };
  }
}
