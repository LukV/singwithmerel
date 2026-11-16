import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readWav } from '../../scripts/voice/wav';
import { Tracker, type Frame } from './tracker';
import { cents } from './yin';

/** A voice-like tone: a fundamental and two harmonics, with a little noise. */
function tone(hz: number, seconds: number, rate: number, level = 0.3): Float32Array {
  const x = new Float32Array(Math.round(seconds * rate));
  let seed = 1;
  const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.02;
  for (let i = 0; i < x.length; i++) {
    const p = (2 * Math.PI * hz * i) / rate;
    x[i] = level * (Math.sin(p) + 0.6 * Math.sin(2 * p) + 0.3 * Math.sin(3 * p)) / 1.9 + noise();
  }
  return x;
}

/** Feed in blocks of 128, as an AudioWorklet does. */
function track(x: Float32Array, rate: number): Frame[] {
  const t = new Tracker(rate);
  const frames: Frame[] = [];
  for (let i = 0; i < x.length; i += 128) frames.push(...t.push(x.subarray(i, i + 128)));
  return frames;
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;

describe('the tracker', () => {
  it('gives a frame about every 10 ms', () => {
    const frames = track(tone(220, 1, 48_000), 48_000);
    expect(frames.length).toBeGreaterThan(90);
    expect(frames.length).toBeLessThan(105);
    expect(frames[1]!.time - frames[0]!.time).toBeCloseTo(0.01, 3);
  });

  it('hears a man, a woman and a child within 5 cents, at 44.1 and 48 kHz', () => {
    for (const rate of [44_100, 48_000]) {
      for (const hz of [82, 110, 196, 262, 440, 660, 988]) {
        const heard = track(tone(hz, 0.5, rate), rate).filter((f) => f.hz !== null);
        expect(heard.length, `${hz} Hz at ${rate}`).toBeGreaterThan(30);
        expect(Math.abs(cents(median(heard.map((f) => f.hz!)), hz)), `${hz} Hz at ${rate}`).toBeLessThan(5);
      }
    }
  });

  it('hears nothing in silence, and measures the level', () => {
    const frames = track(new Float32Array(24_000), 48_000);
    expect(frames.every((f) => f.hz === null && f.level === 0)).toBe(true);
    const loud = track(tone(262, 0.3, 48_000, 0.5), 48_000);
    expect(loud.at(-1)!.level).toBeGreaterThan(0.1);
  });

  it("hears each of Merel's clips on its note", () => {
    const names = readdirSync('voice').filter((f) => f.endsWith('.wav'));
    expect(names.length).toBe(17);
    const hz = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25 };
    for (const name of names) {
      const { rate, samples } = readWav(readFileSync(`voice/${name}`));
      const target = hz[name.match(/-([A-G]\d)\.wav$/)![1] as keyof typeof hz];
      const heard = track(samples, rate).filter((f) => f.hz !== null && f.level > 0.01);
      expect(Math.abs(cents(median(heard.map((f) => f.hz!)), target)), name).toBeLessThan(20);
    }
  });
});
