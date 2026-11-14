import { describe, expect, it } from 'vitest';
import { staffLayout } from './staffLayout';

describe('the staff layout', () => {
  it('matches the canvas on a desktop', () => {
    const l = staffLayout(600, 372, 8, false, null);
    expect(l.s).toBeCloseTo(18, 0);
    expect(l.noteY(0) - l.lineYs[4]!).toBeCloseTo(2 * l.s); // low do sits a line below mi: a ledger line
    expect(l.noteY(2)).toBeCloseTo(l.lineYs[4]!); // mi on the bottom line
    expect(l.offset).toBe(0);
  });

  it('shows four to five notes on a phone and follows the current one', () => {
    const l = staffLayout(340, 180, 8, true, null);
    const visible = (340 - l.notesLeft) / l.spacing;
    expect(visible).toBeGreaterThanOrEqual(3.5);
    expect(visible).toBeLessThanOrEqual(5.5);
    const atEnd = staffLayout(340, 180, 8, true, 7);
    expect(atEnd.offset).toBeGreaterThan(0);
    expect(atEnd.noteX(7)).toBeLessThan(340);
    expect(atEnd.noteX(7)).toBeGreaterThan(atEnd.notesLeft);
  });

  it('puts a bar line after four quarter notes', () => {
    const l = staffLayout(600, 372, 8, false, null);
    expect(l.barXs[0]).toBeGreaterThan(l.noteX(3));
    expect(l.barXs[0]).toBeLessThan(l.noteX(4));
  });
});
