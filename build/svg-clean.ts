import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

/**
 * Imports an SVG from docs/design/assets as a cleaned string: `import s from './x.svg?clean'`.
 * Strips the XML prolog, the c2pa metadata, and the root's size and accessibility attributes
 * (the component that renders it sets those). With `?clean&ink`, the ink colour becomes
 * `currentColor`, so a sign or the wordmark takes the colour of its surroundings.
 */
export function cleanSvg(source: string, ink: boolean): string {
  let s = source
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/g, '')
    .replace(/\s+xmlns:c2pa="[^"]*"/g, '')
    .trim();
  s = s.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    const kept = attrs
      .replace(/\s(width|height|role|aria-label|aria-hidden)="[^"]*"/g, '')
      .trim();
    return `<svg ${kept} aria-hidden="true" focusable="false">`;
  });
  if (ink) s = s.replace(/(stroke|fill)="#121212"/g, '$1="currentColor"');
  return s;
}

export function svgClean(): Plugin {
  return {
    name: 'merel-svg-clean',
    enforce: 'pre',
    load(id) {
      const [file, query] = id.split('?');
      if (!file || !query || !file.endsWith('.svg')) return null;
      const params = new URLSearchParams(query);
      if (!params.has('clean')) return null;
      this.addWatchFile(file);
      const svg = cleanSvg(readFileSync(file, 'utf8'), params.has('ink'));
      return `export default ${JSON.stringify(svg)};`;
    },
  };
}
