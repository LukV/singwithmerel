import { describe, expect, it } from 'vitest';
import { shape } from './piano.ts';

describe('shape', () => {
  const rate = 8000;
  // Half a second of near silence, then three seconds of a loud tone.
  const samples = new Float32Array(rate * 3.5).map((_, i) => (i < rate / 2 ? 0.001 : 0.5 * Math.sin((2 * Math.PI * 440 * i) / rate)));

  it('starts just before the strike and keeps two seconds', () => {
    const out = shape({ rate, samples }).samples;
    expect(out.length).toBe(rate * 2);
    // The first loud sample is within a few milliseconds of the start.
    const first = out.findIndex((v) => Math.abs(v) > 0.1);
    expect(first).toBeLessThan(rate * 0.01);
  });

  it('levels the peak and fades to silence', () => {
    const out = shape({ rate, samples }).samples;
    const peak = Math.max(...out.map(Math.abs));
    expect(peak).toBeCloseTo(0.7, 1);
    expect(Math.abs(out[out.length - 1]!)).toBeLessThan(0.001);
  });
});
