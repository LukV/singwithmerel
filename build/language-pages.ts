import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { LANGS, type Lang } from '../src/i18n/langs.ts';
import { pageMeta } from '../src/i18n/meta.ts';

/**
 * Writes one static page per language, `/en/index.html`, `/fr/index.html` and `/nl/index.html`,
 * and the privacy page in each (`/en/privacy/index.html`), from the built `index.html`, with the
 * page's language, title and description set. The app reads the path and shows the right page.
 * The root `index.html` stays as it is: the app picks a language there and moves to its path.
 */
export function localise(html: string, lang: Lang, page: 'lesson' | 'privacy' = 'lesson'): string {
  const meta = pageMeta[lang];
  return html
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${page === 'privacy' ? meta.privacyTitle : meta.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${meta.description}$2`);
}

export function languagePages(): Plugin {
  return {
    name: 'merel-language-pages',
    apply: 'build',
    writeBundle(options) {
      const dir = options.dir ?? 'dist';
      const html = readFileSync(join(dir, 'index.html'), 'utf8');
      for (const lang of LANGS) {
        mkdirSync(join(dir, lang), { recursive: true });
        writeFileSync(join(dir, lang, 'index.html'), localise(html, lang));
        mkdirSync(join(dir, lang, 'privacy'), { recursive: true });
        writeFileSync(join(dir, lang, 'privacy', 'index.html'), localise(html, lang, 'privacy'));
      }
    },
  };
}
