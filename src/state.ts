import { computed, signal } from '@preact/signals';
import { STRINGS } from './i18n/strings';
import { pathFor, pickLang, type Lang } from './i18n/langs';
import { pageMeta } from './i18n/meta';
import { readProgress, writeProgress } from './progress/store';

export type CardState = 'active' | 'upcoming' | 'completed';

/** The language on screen. */
export const lang = signal<Lang>('en');
export const t = computed(() => STRINGS[lang.value]);

/** Whether Start was pressed; on a phone the instrument slides up then. */
export const started = signal(false);

/** On a phone, whether the docked instrument is open or tucked away to its handle. */
export const dockOpen = signal(true);

/** The note last played on the instrument, as a scale step, or null. */
export const lit = signal<number | null>(null);
/** Counts plays, so playing the same note twice still marks it again. */
export const plays = signal(0);

/** The state of the four exercise cards. Pitch 1.2 derives it from progress. */
export const cards = signal<CardState[]>(['active', 'upcoming', 'upcoming', 'upcoming']);

/** Pick the language at load, store it, and put it in the path. */
export function initLang(): void {
  const chosen = pickLang(location.pathname, readProgress().lang ?? null, navigator.languages ?? [navigator.language]);
  applyLang(chosen, 'replace');
}

export function applyLang(next: Lang, history: 'push' | 'replace' | 'none' = 'push'): void {
  lang.value = next;
  writeProgress({ lang: next });
  document.documentElement.lang = next;
  document.title = pageMeta[next].title;
  const path = pathFor(next);
  if (history !== 'none' && location.pathname !== path) {
    const url = path + location.search + location.hash;
    if (history === 'push') window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
  }
}
