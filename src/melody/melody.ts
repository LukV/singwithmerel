/**
 * The notes of a round, per exercise. Exercises 1 and 2 are the scale up and down in quarter
 * notes; exercises 3 and 4 draw a random three-note melody in one of three shapes, the way a
 * teacher dictates in class (docs/product/0020-features.md#The random melody).
 */

export interface MelodyNote {
  /** Scale step, 0 for low do (C4) to 7 for high do (C5). */
  step: number;
  /** Length in beats: 1 is a quarter note, 2 a half note. */
  beats: number;
}

export type Melody = MelodyNote[];

export type Shape = 'up-up' | 'down-down' | 'up-below';
export const SHAPES: readonly Shape[] = ['up-up', 'down-down', 'up-below'];

/** The range, in scale steps: C4 to C5. */
export const LOW = 0;
export const HIGH = 7;

/** One 4/4 bar: quarter, quarter, half. */
export const RHYTHM = [1, 1, 2] as const;

const quarters = (steps: number[]): Melody => steps.map((step) => ({ step, beats: 1 }));

export const SCALE_UP: Melody = quarters([0, 1, 2, 3, 4, 5, 6, 7]);
export const SCALE_DOWN: Melody = quarters([7, 6, 5, 4, 3, 2, 1, 0]);

/** Which shape three steps make, or null if they make none of the three. */
export function shapeOf([a, b, c]: readonly number[]): Shape | null {
  if (a === undefined || b === undefined || c === undefined) return null;
  if (a < b && b < c) return 'up-up';
  if (a > b && b > c) return 'down-down';
  if (a < b && c < a) return 'up-below';
  return null;
}

/** Every three-note melody of a shape that fits the range. */
export function melodiesOf(shape: Shape): number[][] {
  const all: number[][] = [];
  for (let a = LOW; a <= HIGH; a++)
    for (let b = LOW; b <= HIGH; b++)
      for (let c = LOW; c <= HIGH; c++) if (shapeOf([a, b, c]) === shape) all.push([a, b, c]);
  return all;
}

const BY_SHAPE: Record<Shape, number[][]> = {
  'up-up': melodiesOf('up-up'),
  'down-down': melodiesOf('down-down'),
  'up-below': melodiesOf('up-below'),
};

const same = (a: Melody | null | undefined, steps: number[]) =>
  !!a && a.length === steps.length && a.every((n, i) => n.step === steps[i]);

/**
 * A random melody: a shape at random, then a start and the next notes at random among those that
 * fit the range. Steps are scale notes in the right direction, so a leap stays inside the octave.
 * Never the same as `previous`.
 */
export function randomMelody(previous: Melody | null = null, random: () => number = Math.random): Melody {
  const pick = <T>(list: readonly T[]): T => list[Math.min(list.length - 1, Math.floor(random() * list.length))]!;
  for (;;) {
    const steps = pick(BY_SHAPE[pick(SHAPES)]);
    if (!same(previous, steps)) return steps.map((step, i) => ({ step, beats: RHYTHM[i]! }));
  }
}
