export const LANGS = ['en', 'fr', 'nl'] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/** The language a path names, as in `/fr/` or `/fr`, or null. */
export function langFromPath(path: string): Lang | null {
  const first = path.split('/').filter(Boolean)[0];
  return isLang(first) ? first : null;
}

/** The first of the browser's languages we speak, or English. */
export function langFromBrowser(languages: readonly string[]): Lang {
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }
  return 'en';
}

/** The path never wins over nothing: path first, then what was chosen before, then the browser. */
export function pickLang(path: string, stored: Lang | null, languages: readonly string[]): Lang {
  return langFromPath(path) ?? stored ?? langFromBrowser(languages);
}

export function pathFor(lang: Lang): string {
  return `/${lang}/`;
}
