import { isLang, type Lang } from '../i18n/langs';

/**
 * The `merel.v1` record in local storage (docs/architecture/0010-overview.md#Progress).
 * Pitch 1.1 keeps only the language; 1.2 adds levels, dots and the progress code.
 */
export const STORAGE_KEY = 'merel.v1';

export interface Progress {
  version: 1;
  lang?: Lang;
  updated?: string;
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
    const data: unknown = raw ? JSON.parse(raw) : null;
    if (data && typeof data === 'object' && (data as { version?: unknown }).version === 1) {
      const lang = (data as { lang?: unknown }).lang;
      return { ...(data as Progress), lang: isLang(lang) ? lang : undefined };
    }
  } catch {
    // a damaged record is treated as none
  }
  return { version: 1 };
}

export function writeProgress(change: Partial<Omit<Progress, 'version'>>): void {
  const next: Progress = { ...readProgress(), ...change, version: 1, updated: new Date().toISOString() };
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // full or blocked storage: nothing to do
  }
}
