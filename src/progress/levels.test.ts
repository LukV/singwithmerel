import { describe, expect, it } from 'vitest';
import { activeLevel, completeRound, levelStates, skipLevel } from './levels';
import { empty, type Progress } from './store';

const rounds = (p: Progress, level: number, n: number) => {
  for (let i = 0; i < n; i++) p = completeRound(p, level).progress;
  return p;
};

describe('levels and dots', () => {
  it('start with level 1 active', () => {
    expect(activeLevel(empty())).toBe(1);
    expect(levelStates(empty())).toEqual(['active', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('fill one dot per round, and open the next level at five', () => {
    let p = rounds(empty(), 1, 4);
    expect(p.levels[1]).toEqual({ dots: 4 });
    expect(activeLevel(p)).toBe(1);
    const fifth = completeRound(p, 1);
    expect(fifth.levelDone).toBe(true);
    p = fifth.progress;
    expect(p.levels[1]).toEqual({ dots: 5, done: true });
    expect(levelStates(p)).toEqual(['completed', 'active', 'upcoming', 'upcoming']);
  });

  it('keep a done level at five dots when played again', () => {
    const p = rounds(empty(), 1, 7);
    expect(p.levels[1]).toEqual({ dots: 5, done: true });
    expect(completeRound(p, 1).levelDone).toBe(false);
  });

  it('skip a level without filling its dots', () => {
    const p = skipLevel(rounds(empty(), 1, 5), 2);
    expect(p.levels[2]).toBeUndefined();
    expect(levelStates(p)).toEqual(['completed', 'completed', 'active', 'upcoming']);
  });

  it('have no active level when all four are behind', () => {
    let p = empty();
    for (const l of [1, 2, 3, 4]) p = rounds(p, l, 5);
    expect(activeLevel(p)).toBeNull();
    expect(levelStates(p)).toEqual(['completed', 'completed', 'completed', 'completed']);
  });
});
