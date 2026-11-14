/**
 * Where everything on the staff goes, in pixels, for a given box. Every length is a multiple
 * of `s`, half the distance between two staff lines, so the staff scales by being redrawn.
 * The proportions follow the canvas mockup, where s was 18 px on a 372 px high staff.
 */

export interface StaffLayout {
  s: number;
  /** y of the top line (F5); the lines are 2s apart, down to E4. */
  top: number;
  lineYs: number[];
  /** The clef's box. */
  clef: { x: number; y: number; width: number; height: number };
  /** Centre x of the 4/4 time signature, and the y of each figure's centre. */
  time: { x: number; y1: number; y2: number; size: number };
  /** Left edge of the notes area; notes are clipped to it when the staff scrolls. */
  notesLeft: number;
  /** Distance between two notes. */
  spacing: number;
  /** How far the notes are scrolled to the left, to keep the current note in view. */
  offset: number;
  noteX: (i: number) => number;
  noteY: (step: number) => number;
  barXs: number[];
  endX: number;
  nameY: number;
  letterY: number;
}

/** Height of the staff box in units of s. */
export const STAFF_UNITS = 20.6;
/** On a phone the clef may reach above the box and the names sit closer: more size for less room. */
export const COMPACT_UNITS = 18.4;
const LEFT = 10.9;
const RIGHT = 1.7;

export function staffLayout(width: number, height: number, count: number, compact: boolean, current: number | null): StaffLayout {
  const units = compact ? COMPACT_UNITS : STAFF_UNITS;
  const s = Math.max(4, Math.min(height / units, width / (compact ? 30 : 33)));
  // Centred in its box when the width, not the height, sets the size.
  const top = (compact ? 4.4 : 5.5) * s + Math.max(0, (height - units * s) / 2);
  const lineYs = [0, 1, 2, 3, 4].map((k) => top + 2 * s * k);
  const notesLeft = LEFT * s;
  const available = Math.max(0, width - notesLeft - RIGHT * s);
  // A little room between the last note and the final double bar.
  const tail = 0.8 * s;
  // On a phone the notes keep a readable spacing and the staff follows the current note.
  const fit = (available - tail) / count;
  const spacing = compact ? Math.max(fit, 5.6 * s) : fit;
  const content = spacing * count + tail;
  let offset = 0;
  if (content > available && current !== null) {
    const centre = spacing * (current + 0.5);
    // Keep the current note in the middle, as far as the ends of the staff allow.
    offset = Math.min(Math.max(centre - available / 2, 0), content - available);
  }
  const noteX = (i: number) => notesLeft + spacing * (i + 0.5) - offset;
  const half = Math.floor(count / 2);
  return {
    s,
    top,
    lineYs,
    clef: { x: 0, y: top - 5 * s, width: 7.5 * s, height: 18.8 * s },
    time: { x: 9.1 * s, y1: top + 2 * s, y2: top + 6 * s, size: 4.6 * s },
    notesLeft,
    spacing,
    offset,
    noteX,
    noteY: (step) => top + 10 * s - step * s,
    barXs: count > 4 ? [notesLeft + spacing * half - offset] : [],
    endX: notesLeft + content - offset,
    nameY: top + (compact ? 12.3 : 12.6) * s,
    letterY: top + (compact ? 13.5 : 13.9) * s,
  };
}
