import { isLang, type Lang } from '../i18n/langs';

/**
 * The `merel.v1` record in local storage (docs/architecture/0010-overview.md#Progress):
 * the language, and per level its dots and whether it is done; levels skipped.
 */
export const STORAGE_KEY = 'merel.v1';
export const LEVELS = [1, 2, 3, 4] as const;
export const DOTS = 5;

export interface LevelProgress {
  dots: number;
  done?: boolean;
}

export interface Progress {
  version: 1;
  lang?: Lang;
  levels: Record<string, LevelProgress>;
  skipped: number[];
  updated?: string;
}

export const empty = (): Progress => ({ version: 1, levels: {}, skipped: [] });

/** A record read from anywhere (storage, a pasted code), checked and made whole; null if it is not one. */
export function normalise(data: unknown): Progress | null {
  if (!data || typeof data !== 'object' || (data as { version?: unknown }).version !== 1) return null;
  const d = data as Record<string, unknown>;
  const levels: Record<string, LevelProgress> = {};
  if (d.levels && typeof d.levels === 'object') {
    for (const level of LEVELS) {
      const l = (d.levels as Record<string, unknown>)[level];
      if (!l || typeof l !== 'object') continue;
      const raw = Number((l as { dots?: unknown }).dots);
      const dots = Number.isFinite(raw) ? Math.max(0, Math.min(DOTS, Math.floor(raw))) : 0;
      levels[level] = (l as { done?: unknown }).done === true || dots === DOTS ? { dots, done: true } : { dots };
    }
  }
  const skipped = Array.isArray(d.skipped)
    ? [...new Set(d.skipped.filter((n): n is number => (LEVELS as readonly unknown[]).includes(n)))].sort()
    : [];
  return {
    version: 1,
    ...(isLang(d.lang) ? { lang: d.lang } : {}),
    levels,
    skipped,
    ...(typeof d.updated === 'string' ? { updated: d.updated } : {}),
  };
}

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage can be blocked; the app still works, it just forgets
  }
}

export function readProgress(): Progress {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    return (raw && normalise(JSON.parse(raw))) || empty();
  } catch {
    return empty(); // a damaged record is treated as none
  }
}

export function saveProgress(progress: Progress): Progress {
  const next = { ...progress, updated: new Date().toISOString() };
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // full or blocked storage: nothing to do
  }
  return next;
}

export function writeProgress(change: Partial<Omit<Progress, 'version'>>): Progress {
  return saveProgress({ ...readProgress(), ...change, version: 1 });
}
