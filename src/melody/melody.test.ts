import { describe, expect, it } from 'vitest';
import { HIGH, LOW, SCALE_DOWN, SCALE_UP, SHAPES, melodiesOf, randomMelody, shapeOf, type Melody } from './melody';
import { seeded } from '../ui/hand';

describe('the scale exercises', () => {
  it('go up and down the octave in quarter notes', () => {
    expect(SCALE_UP.map((n) => n.step)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(SCALE_DOWN.map((n) => n.step)).toEqual([7, 6, 5, 4, 3, 2, 1, 0]);
    expect([...SCALE_UP, ...SCALE_DOWN].every((n) => n.beats === 1)).toBe(true);
  });
});

describe('the shapes', () => {
  it('are recognised', () => {
    expect(shapeOf([0, 2, 4])).toBe('up-up');
    expect(shapeOf([5, 3, 1])).toBe('down-down');
    expect(shapeOf([2, 4, 1])).toBe('up-below');
    expect(shapeOf([2, 4, 3])).toBeNull(); // up, then down but not below the start
    expect(shapeOf([2, 2, 3])).toBeNull();
  });

  it('each have melodies that fit the range', () => {
    for (const shape of SHAPES) expect(melodiesOf(shape).length).toBeGreaterThan(0);
  });
});

describe('a thousand random melodies', () => {
  const random = seeded(2026);
  const draws: Melody[] = [];
  let previous: Melody | null = null;
  for (let i = 0; i < 1000; i++) {
    previous = randomMelody(previous, random);
    draws.push(previous);
  }

  it('are three notes in one 4/4 bar: quarter, quarter, half', () => {
    for (const m of draws) {
      expect(m).toHaveLength(3);
      expect(m.map((n) => n.beats)).toEqual([1, 1, 2]);
    }
  });

  it('only take the three shapes, inside C4 to C5', () => {
    for (const m of draws) {
      expect(shapeOf(m.map((n) => n.step))).not.toBeNull();
      for (const n of m) {
        expect(n.step).toBeGreaterThanOrEqual(LOW);
        expect(n.step).toBeLessThanOrEqual(HIGH);
      }
    }
  });

  it('are never the same twice in a row', () => {
    for (let i = 1; i < draws.length; i++) expect(draws[i]!.map((n) => n.step)).not.toEqual(draws[i - 1]!.map((n) => n.step));
  });

  it('use all three shapes, about equally', () => {
    const counts = { 'up-up': 0, 'down-down': 0, 'up-below': 0 };
    for (const m of draws) counts[shapeOf(m.map((n) => n.step))!]++;
    for (const shape of SHAPES) expect(counts[shape]).toBeGreaterThan(250);
  });

  it('start on many different notes', () => {
    expect(new Set(draws.map((m) => m[0]!.step)).size).toBeGreaterThanOrEqual(6);
  });
});
