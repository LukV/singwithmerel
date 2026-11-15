import { describe, expect, it } from 'vitest';
import { SCALE_UP } from '../melody/melody';
import { LISTEN, fold, listenFor } from './ear';
import type { Frame } from './tracker';

/** A pitch track: each part a pitch in Hz (or null for silence) held for some seconds, a frame every 10 ms. */
function track(parts: [number | null, number][], level = 0.1): Frame[] {
  const frames: Frame[] = [];
  let time = 0;
  for (const [hz, seconds] of parts) {
    for (let k = 0; k < Math.round(seconds / 0.01); k++) {
      time += 0.01;
      frames.push({ time, hz, clarity: hz ? 0.95 : 0, level: hz ? level : 0 });
    }
  }
  return frames;
}

const found = (frames: Frame[], melody = SCALE_UP) => {
  const ear = listenFor(melody);
  const events = frames.map((f) => ear.hear(f)).filter(Boolean);
  return { count: ear.found, events };
};

describe('the steady-tone rule', () => {
  it('folds cents into one octave', () => {
    expect(fold(1200)).toBe(0);
    expect(fold(-1200)).toBe(0);
    expect(fold(1150)).toBe(-50);
    expect(fold(700)).toBe(-500);
  });

  it('counts a tone held for 0.3 s, once, as soon as it is held', () => {
    const { count, events } = found(track([[262, 1]]));
    expect(count).toBe(1);
    expect(events).toEqual([{ type: 'found', index: 0 }]);
    expect(found(track([[262, LISTEN.hold - 0.05]])).count).toBe(0);
  });

  it('counts one tone per change of pitch or pause', () => {
    expect(found(track([[262, 0.5], [294, 0.5], [330, 0.5]])).count).toBe(3);
    expect(found(track([[262, 0.5], [null, 0.2], [262, 0.5]])).count).toBe(2);
  });

  it('does not break a tone on a short gap or one stray frame', () => {
    expect(found(track([[262, 0.2], [null, 0.05], [262, 0.2]])).count).toBe(1);
    expect(found(track([[262, 0.2], [131, 0.01], [262, 0.2]])).count).toBe(1);
  });

  it('does not count a slide or a wobble wider than a quarter tone', () => {
    const slide: [number, number][] = Array.from({ length: 60 }, (_, k) => [262 * 2 ** (k * 8 / 1200), 0.01]);
    expect(found(track(slide)).count).toBe(0);
  });

  it('ignores sound below the level gate', () => {
    expect(found(track([[262, 1]], LISTEN.gate / 2)).count).toBe(0);
  });

  it('stops at the length of the melody', () => {
    const many: [number, number][] = Array.from({ length: 10 }, (_, k) => [k % 2 ? 330 : 262, 0.4]);
    expect(found(track(many)).count).toBe(SCALE_UP.length);
  });
});
