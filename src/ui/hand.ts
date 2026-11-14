/**
 * Hand-drawn lines, drawn per size rather than scaled: a straight line from A to B with a
 * slight, seeded wobble every `step` pixels, so a staff stretched across a wide screen
 * wobbles as much as one on a phone, and a line looks the same on every render.
 */

/** A small deterministic random generator (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export interface HandOptions {
  /** How far, in pixels, the line strays sideways at most. */
  wobble?: number;
  /** Distance between wobble points, in pixels. */
  step?: number;
  seed?: number;
}

export function handLine(x1: number, y1: number, x2: number, y2: number, opts: HandOptions = {}): string {
  const { wobble = 1.2, step = 46, seed = 1 } = opts;
  const rand = seeded(seed);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length === 0) return `M${r1(x1)} ${r1(y1)}`;
  const nx = -dy / length;
  const ny = dx / length;
  const segments = Math.max(1, Math.round(length / step));
  const off = () => (rand() * 2 - 1) * wobble;
  let d = `M${r1(x1 + nx * off() * 0.5)} ${r1(y1 + ny * off() * 0.5)}`;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const tc = (i - 0.5) / segments;
    const oc = off();
    const oe = i === segments ? off() * 0.5 : off() * 0.4;
    const cx = x1 + dx * tc + nx * oc;
    const cy = y1 + dy * tc + ny * oc;
    const ex = x1 + dx * t + nx * oe;
    const ey = y1 + dy * t + ny * oe;
    d += ` Q${r1(cx)} ${r1(cy)} ${r1(ex)} ${r1(ey)}`;
  }
  return d;
}
