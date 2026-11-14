import { describe, expect, it } from 'vitest';
import { handLine } from './hand';

describe('hand-drawn lines', () => {
  it('are the same for the same seed', () => {
    expect(handLine(0, 0, 400, 0, { seed: 3 })).toBe(handLine(0, 0, 400, 0, { seed: 3 }));
    expect(handLine(0, 0, 400, 0, { seed: 3 })).not.toBe(handLine(0, 0, 400, 0, { seed: 4 }));
  });

  it('keep their wobble in pixels however long they are', () => {
    for (const width of [200, 2000]) {
      const ys = handLine(0, 50, width, 50, { wobble: 2, seed: 9 })
        .match(/-?\d+(\.\d+)?/g)!
        .map(Number)
        .filter((_, i) => i % 2 === 1);
      for (const y of ys) expect(Math.abs(y - 50)).toBeLessThanOrEqual(2);
    }
  });

  it('add a wobble point about every step', () => {
    const segments = (d: string) => d.split('Q').length - 1;
    expect(segments(handLine(0, 0, 460, 0, { step: 46 }))).toBe(10);
    expect(segments(handLine(0, 0, 4600, 0, { step: 46 }))).toBe(100);
  });
});
