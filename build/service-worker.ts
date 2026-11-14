import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Writes `dist/sw.js` once the build is complete: the worker in `build/sw-template.js` with the list
 * of every file to keep offline (pages, scripts, styles, fonts, icons, Merel's clips) and a version
 * made from their contents, so a new build is a new cache and an unchanged one is not.
 */

/** Which built files the offline cache holds: not the worker itself, not source maps, and fonts only in woff2. */
export function precached(path: string): boolean {
  if (path === 'sw.js' || path.endsWith('.map')) return false;
  if (path.endsWith('.woff')) return false;
  if (path.startsWith('voice/source/')) return false;
  return true;
}

function walk(dir: string, root = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path, root) : [relative(root, path).split(sep).join('/')];
  });
}

export function serviceWorkerSource(template: string, files: { path: string; content: Buffer }[]): string {
  const hash = createHash('sha256');
  const list: string[] = [];
  for (const f of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    if (!precached(f.path)) continue;
    hash.update(f.path).update(f.content);
    list.push(`/${f.path}`);
  }
  return template.replace('__VERSION__', hash.digest('hex').slice(0, 12)).replace('__FILES__', JSON.stringify(list));
}

export function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'merel-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const template = readFileSync(new URL('./sw-template.js', import.meta.url), 'utf8');
      const files = walk(outDir).map((path) => ({ path, content: readFileSync(join(outDir, path)) }));
      writeFileSync(join(outDir, 'sw.js'), serviceWorkerSource(template, files));
    },
  };
}
