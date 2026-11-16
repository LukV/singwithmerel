import { describe, expect, it } from 'vitest';
import { advance, goesUp, melodyFor, newRound, type Round, type RoundEvent } from './round';

const run = (round: Round, events: RoundEvent[]) => {
  let completed = 0;
  for (const e of events) {
    const r = advance(round, e);
    round = r.round;
    if (r.completed) completed++;
  }
  return { round, completed };
};

describe('a singing round', () => {
  it('goes hear, sing along, your turn, and completes when sing along ends', () => {
    const r = newRound(1, melodyFor(1));
    const afterHear = advance(r, { type: 'played' });
    expect(afterHear.round.phase).toBe('along');
    expect(afterHear.completed).toBe(false);
    const afterAlong = advance(afterHear.round, { type: 'played' });
    expect(afterAlong.round.phase).toBe('turn');
    expect(afterAlong.completed).toBe(true);
  });

  it('with Merel listening, completes when the last note is sung, not after sing along', () => {
    const { round, completed } = run(newRound(1, melodyFor(1), 'hear', true), [{ type: 'played' }, { type: 'played' }]);
    expect(round.phase).toBe('turn');
    expect(completed).toBe(0);
    const sung = run(round, Array.from({ length: 8 }, () => ({ type: 'sung' }) as const));
    expect(sung.round.sung).toBe(8);
    expect(sung.round.phase).toBe('done');
    expect(sung.completed).toBe(1);
  });

  it('starts again from do after a miss, counts the tries, and completes on the last note', () => {
    const { round } = run(newRound(1, melodyFor(1), 'hear', true), [{ type: 'played' }, { type: 'played' }, { type: 'sung' }, { type: 'sung' }]);
    const missed = run(round, [{ type: 'missed' }, { type: 'missed' }]);
    expect(missed.round.sung).toBe(0);
    expect(missed.round.tries).toBe(2);
    expect(missed.round.missed).toBe(true);
    expect(missed.round.phase).toBe('turn');
    expect(missed.completed).toBe(0);
    const again = run(missed.round, [{ type: 'sung' }]);
    expect(again.round.missed).toBe(false);
    const rest = run(again.round, Array.from({ length: 7 }, () => ({ type: 'sung' }) as const));
    expect(rest.round.phase).toBe('done');
    expect(rest.completed).toBe(1);
  });

  it('keeps the notes found after a wrong note, counts it, and starts from do after Hear it', () => {
    const { round } = run(newRound(1, melodyFor(1), 'hear', true), [{ type: 'played' }, { type: 'played' }, { type: 'sung' }, { type: 'sung' }]);
    const wrong = run(round, [{ type: 'wrong' }]);
    expect(wrong.round.sung).toBe(2);
    expect(wrong.round.tries).toBe(1);
    expect(wrong.round.off).toBe(true);
    expect(wrong.round.missed).toBe(false);
    const on = run(wrong.round, [{ type: 'sung' }]);
    expect(on.round.sung).toBe(3);
    expect(on.round.off).toBe(false);
    const heard = run(on.round, [{ type: 'wrong' }, { type: 'again' }]);
    expect(heard.round.sung).toBe(0);
    expect(heard.round.off).toBe(false);
    expect(heard.round.tries).toBe(2);
    expect(heard.round.phase).toBe('turn');
  });

  it('falls back to the release 1 rule when Merel cannot listen after all', () => {
    const along = run(newRound(3, melodyFor(3), 'hear', true), [{ type: 'played' }, { type: 'played' }, { type: 'sung' }]);
    const { round, completed } = run(along.round, [{ type: 'deaf' }]);
    expect(completed).toBe(1);
    expect(round.listen).toBe(false);
    expect(round.phase).toBe('turn');
    expect(advance(round, { type: 'sung' }).round).toBe(round);
  });

  it('never listens in recognition', () => {
    expect(newRound(4, melodyFor(4), 'hear', true).listen).toBe(false);
  });

  it('ignores keys and answers', () => {
    const r = newRound(3, melodyFor(3));
    expect(advance(r, { type: 'key', step: 0 }).round).toBe(r);
    expect(advance(r, { type: 'answer', up: true }).round).toBe(r);
  });
});

describe('a recognition round', () => {
  const melody = [
    { step: 2, beats: 1 },
    { step: 4, beats: 1 },
    { step: 1, beats: 2 },
  ]; // up, then below the start

  it('asks up or down per step, then the notes, and completes when all three are found', () => {
    const { round, completed } = run(newRound(4, melody), [
      { type: 'played' },
      { type: 'answer', up: true },
      { type: 'answer', up: false },
      { type: 'key', step: 2 },
      { type: 'key', step: 4 },
      { type: 'key', step: 1 },
    ]);
    expect(round.phase).toBe('done');
    expect(round.found).toBe(3);
    expect(completed).toBe(1);
  });

  it('shows a wrong direction and lets you try again', () => {
    const { round } = run(newRound(4, melody), [{ type: 'played' }, { type: 'answer', up: false }]);
    expect(round.phase).toBe('direction');
    expect(round.dir).toBe(0);
    expect(round.wrong).toEqual({ kind: 'direction' });
    const again = advance(round, { type: 'answer', up: true }).round;
    expect(again.dir).toBe(1);
    expect(again.wrong).toBeNull();
  });

  it('shows a wrong note in place and never resets what was found', () => {
    const { round } = run(newRound(4, melody), [
      { type: 'played' },
      { type: 'answer', up: true },
      { type: 'answer', up: false },
      { type: 'key', step: 2 },
      { type: 'key', step: 5 },
    ]);
    expect(round.found).toBe(1);
    expect(round.wrong).toEqual({ kind: 'note', step: 5 });
    expect(advance(round, { type: 'key', step: 4 }).round.found).toBe(2);
  });

  it('knows which way each step goes', () => {
    expect(goesUp(melody, 0)).toBe(true);
    expect(goesUp(melody, 1)).toBe(false);
  });
});
