import { DOTS, LEVELS, type Progress } from './store';

export type LevelState = 'active' | 'upcoming' | 'completed';

export const isDone = (p: Progress, level: number) => !!p.levels[level]?.done;
export const isSkipped = (p: Progress, level: number) => p.skipped.includes(level);
export const dotsOf = (p: Progress, level: number) => p.levels[level]?.dots ?? 0;

/** The level to work on: the first one neither done nor skipped, or null when all four are behind. */
export function activeLevel(p: Progress): number | null {
  return LEVELS.find((l) => !isDone(p, l) && !isSkipped(p, l)) ?? null;
}

/** Levels before the active one are completed (done or skipped), after it upcoming. */
export function levelStates(p: Progress): LevelState[] {
  const active = activeLevel(p);
  return LEVELS.map((l) => (active === null || l < active ? 'completed' : l === active ? 'active' : 'upcoming'));
}

/** One completed round fills one dot; the fifth completes the level and opens the next. */
export function completeRound(p: Progress, level: number): { progress: Progress; levelDone: boolean } {
  const before = p.levels[level] ?? { dots: 0 };
  if (before.done) return { progress: p, levelDone: false };
  const dots = Math.min(DOTS, before.dots + 1);
  const levelDone = dots === DOTS;
  return {
    progress: { ...p, levels: { ...p.levels, [level]: levelDone ? { dots, done: true } : { dots } } },
    levelDone,
  };
}

/** "Skip this level" opens the next level without filling the dots. */
export function skipLevel(p: Progress, level: number): Progress {
  return isSkipped(p, level) ? p : { ...p, skipped: [...p.skipped, level].sort() };
}
