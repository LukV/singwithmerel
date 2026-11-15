import { describe, expect, it } from 'vitest';
import { SCALE_DOWN, SCALE_UP, type Melody } from '../melody/melody';
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

  it('takes the first steady note as do, wherever it is, and judges the rest from it', () => {
    const j = judgeFor(SCALE_UP);
    // A low man's scale from A2, a little sharp: do is A, 330 cents below C.
    for (const f of track(sing(SCALE.map((s) => s - 15), 0.5, 30))) j.hear(f);
    expect(j.found).toBe(8);
    expect(j.key).toBeCloseTo(-270, 0);
  });

  it('finds the scale down sung legato, each note gliding into the next', () => {
    // No breath between notes: 0.4 s on each, 0.1 s gliding to the next, from a man's low do.
    const glide = (semis: number[]): [number, number][] =>
      semis.flatMap((s, i) => {
        const next = semis[i + 1];
        const held: [number, number][] = [[hz(s - 15), 0.4]];
        if (next === undefined) return held;
        return [...held, ...Array.from({ length: 10 }, (_, k): [number, number] => [hz(s - 15 + ((next - s) * (k + 1)) / 10), 0.01])];
      });
    expect(judge(track(glide([...SCALE].reverse())), SCALE_DOWN).found).toBe(8);
    expect(judge(track(glide(SCALE))).found).toBe(8);
  });

  it('follows a singer who drifts sharp, a little each note', () => {
    const drift: [number, number][] = SCALE.map((s, i) => [hz(s, 20 * i), 0.5]);
    expect(judge(track(drift)).found).toBe(8);
  });

  it('finds the scale down sung from above into each note, sinking, with a flat low do', () => {
    // Each note glides in from 70 cents above over 0.25 s, then holds; 10 cents flatter each note,
    // the low do 70 cents flatter still. A note split into a scoop and a hold is not a wrong note.
    const parts: [number | null, number][] = [...SCALE].reverse().flatMap((s, i): [number | null, number][] => {
      const base = s - 15 + (-10 * i - (i === 7 ? 70 : 0)) / 100;
      const scoop = Array.from({ length: 25 }, (_, k): [number, number] => [hz(base + (0.7 * (25 - k)) / 25), 0.01]);
      return [...scoop, [hz(base), 0.25], [null, 0.08]];
    });
    expect(judge(track(parts), SCALE_DOWN).found).toBe(8);
  });

  it('follows a singer who sinks going down, a quarter of a semitone each note', () => {
    const sink: [number, number][] = [...SCALE].reverse().map((s, i) => [hz(s - 12, -25 * i), 0.5]);
    expect(judge(track(sink), SCALE_DOWN).found).toBe(8);
  });

  it('takes a new do after a miss', () => {
    const j = judgeFor(SCALE_UP);
    for (const f of track([...sing([0, 2, 6]), [null, 0.3], ...sing(SCALE.map((s) => s + 3))])) j.hear(f);
    expect(j.found).toBe(8);
    expect(j.key).toBeCloseTo(300, 0);
  });

  it('allows up to a semitone off from your do, not more', () => {
    const doReMi: Melody = [0, 1, 2].map((step) => ({ step, beats: 1 }));
    const off = (cents: number): [number, number][] => [[hz(0), 0.5], [hz(2, cents), 0.5], [hz(4, cents), 0.5]];
    expect(judge(track(off(90)), doReMi).found).toBe(3);
    expect(judge(track(off(-90)), doReMi).found).toBe(3);
    expect(judge(track([...off(140), [null, 0.2]]), doReMi).events[0]).toEqual({ type: 'found', index: 0 });
    expect(judge(track([...off(140), [null, 0.2]]), doReMi).misses).toBe(1);
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

  it('misses when you stop singing before the end, and starts again from do', () => {
    const { found, events, misses } = judge(track([...sing([0, 2]), [null, JUDGE.silence + 0.1]]));
    expect(found).toBe(0);
    expect(misses).toBe(1);
    expect(events.at(-1)).toEqual({ type: 'miss' });
  });

  it('does not miss before you sing, nor after the last note', () => {
    expect(judge(track([[null, 3]])).misses).toBe(0);
    expect(judge(track([...sing(SCALE), [null, 3]])).misses).toBe(0);
  });

  it('misses as soon as you hold a wrong note, without waiting for silence, and starts again from do', () => {
    const melody: Melody = [{ step: 0, beats: 1 }, { step: 2, beats: 1 }, { step: 4, beats: 2 }];
    const { misses, found, events } = judge(track([...sing([0, 4, 6]), [null, 0.2]]), melody);
    expect(events.filter((e) => e.type === 'found')).toHaveLength(2);
    expect(misses).toBe(1);
    expect(found).toBe(0);
    // From do again, the melody completes.
    expect(judge(track([...sing([0, 4, 6]), [null, 0.3], ...sing([0, 4, 7])]), melody).found).toBe(3);
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
