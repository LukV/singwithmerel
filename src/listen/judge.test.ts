import { describe, expect, it } from 'vitest';
import { SCALE_UP, type Melody } from '../melody/melody';
import { freqFromC4 } from '../melody/scale';
import { JUDGE, fold, judgeFor } from './judge';
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

/** Semitones above C4 to Hz, with an offset in cents. */
const hz = (semitones: number, cents = 0) => freqFromC4(semitones + cents / 100);
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12];
const sing = (semis: number[], seconds = 0.5, cents = 0): [number, number][] => semis.map((s) => [hz(s, cents), seconds]);

function judge(frames: Frame[], melody: Melody = SCALE_UP) {
  const j = judgeFor(melody);
  const events = frames.map((f) => j.hear(f)).filter((e) => e !== null);
  return { found: j.found, events, misses: events.filter((e) => e.type === 'miss').length };
}

describe('the mild judge', () => {
  it('folds cents into one octave', () => {
    expect(fold(1200)).toBe(0);
    expect(fold(-1200)).toBe(0);
    expect(fold(1150)).toBe(-50);
    expect(fold(700)).toBe(-500);
  });

  it('finds every note of the scale sung in tune, in order', () => {
    const { found, events } = judge(track(sing(SCALE)));
    expect(found).toBe(8);
    expect(events).toEqual(SCALE.map((_, index) => ({ type: 'found', index })));
  });

  it('finds them an octave lower or higher', () => {
    expect(judge(track(sing(SCALE.map((s) => s - 12)))).found).toBe(8);
    expect(judge(track(sing(SCALE.map((s) => s + 12)))).found).toBe(8);
  });

  it('allows up to a semitone off, not more', () => {
    const doReMi: Melody = [0, 1, 2].map((step) => ({ step, beats: 1 }));
    expect(judge(track(sing([0, 2, 4], 0.5, 90)), doReMi).found).toBe(3);
    expect(judge(track(sing([0, 2, 4], 0.5, -90)), doReMi).found).toBe(3);
    expect(judge(track(sing([0, 2, 4], 0.5, 140)), doReMi).found).toBe(0);
  });

  it('needs the note held for the hold time', () => {
    expect(judge(track([[hz(0), JUDGE.hold + 0.05]])).found).toBe(1);
    expect(judge(track([[hz(0), JUDGE.hold - 0.05]])).found).toBe(0);
  });

  it('takes a note between two neighbours for the one just found, not for both', () => {
    // mi, then a long tone a little above mi: nearer mi than fa, so fa is not found by it.
    const miFa: Melody = [2, 3].map((step) => ({ step, beats: 1 }));
    expect(judge(track([[hz(4), 0.4], [hz(4, 30), 0.6]]), miFa).found).toBe(1);
    expect(judge(track([[hz(4), 0.4], [hz(5), 0.4]]), miFa).found).toBe(2);
  });

  it('does not count a wrong note, and waits for the right one', () => {
    // do re, then re again instead of mi, then mi: mi is found after all.
    const { found, events } = judge(track(sing([0, 2, 2, 4])));
    expect(found).toBe(3);
    expect(events.at(-1)).toEqual({ type: 'found', index: 2 });
  });

  it('does not count a slide through a note before the hold time', () => {
    // A slide from do to mi passes re too quickly to count, so mi, out of turn, does not count either.
    const slide: [number, number][] = Array.from({ length: 30 }, (_, k) => [hz((k * 4) / 30), 0.01]);
    const { found } = judge(track([[hz(0), 0.5], ...slide, [hz(4), 0.5]]), [{ step: 0, beats: 1 }, { step: 1, beats: 1 }, { step: 2, beats: 1 }]);
    expect(found).toBe(1);
  });

  it('keeps a note held across a short pause or a stray frame', () => {
    expect(judge(track([[hz(0), 0.2], [null, 0.05], [hz(0), 0.2]])).found).toBe(1);
    expect(judge(track([[hz(0), 0.2], [hz(7), 0.02], [hz(0), 0.2]])).found).toBe(1);
  });

  it('needs a new start for the same note in another octave right after', () => {
    const melody: Melody = [{ step: 7, beats: 1 }, { step: 0, beats: 1 }];
    expect(judge(track([[hz(12), 1]]), melody).found).toBe(1);
    expect(judge(track([[hz(12), 0.5], [null, 0.2], [hz(0), 0.5]]), melody).found).toBe(2);
  });

  it('ignores sound below the level gate', () => {
    expect(judge(track([[hz(0), 1]], JUDGE.gate / 2)).found).toBe(0);
  });

  it('misses when you stop singing before the end, and keeps what was found', () => {
    const { found, events, misses } = judge(track([...sing([0, 2]), [null, JUDGE.silence + 0.1]]));
    expect(found).toBe(2);
    expect(misses).toBe(1);
    expect(events.at(-1)).toEqual({ type: 'miss' });
  });

  it('does not miss before you sing, nor after the last note', () => {
    expect(judge(track([[null, 3]])).misses).toBe(0);
    expect(judge(track([...sing(SCALE), [null, 3]])).misses).toBe(0);
  });

  it('misses when you sing on past the notes left', () => {
    // Three wrong notes for a three-note melody: a miss without waiting for silence.
    const melody: Melody = [{ step: 0, beats: 1 }, { step: 2, beats: 1 }, { step: 4, beats: 2 }];
    const { misses, found } = judge(track([...sing([7, 9, 7]), [null, 0.2]]), melody);
    expect(found).toBe(0);
    expect(misses).toBe(1);
  });

  it('starts from a given note, and afresh after a rest', () => {
    const j = judgeFor(SCALE_UP, JUDGE, 2);
    for (const f of track(sing([4]))) j.hear(f);
    expect(j.found).toBe(3);
    const k = judgeFor(SCALE_UP);
    const frames = track([...sing([0]), [null, 1], [null, 1]]);
    let miss = false;
    frames.forEach((f, i) => {
      if (i === 60) k.rest();
      if (k.hear(f)?.type === 'miss') miss = true;
    });
    expect(miss).toBe(false);
  });
});
