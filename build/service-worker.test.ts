import { describe, expect, it } from 'vitest';
import { precached, serviceWorkerSource } from './service-worker';

const file = (path: string, content = path) => ({ path, content: Buffer.from(content) });

describe('the service worker', () => {
  it('keeps pages, scripts, woff2 fonts, icons and clips, not the worker, maps, woff or the clip sources', () => {
    expect(['index.html', 'en/index.html', 'assets/a.js', 'assets/f.woff2', 'icon-192.png', 'voice/do-C4.m4a'].every(precached)).toBe(true);
    expect(['sw.js', 'assets/a.js.map', 'assets/f.woff', 'voice/source/do-C4.wav'].some(precached)).toBe(false);
  });

  it('lists the files and changes its version only when a file changes', () => {
    const template = "const VERSION = '__VERSION__'; const FILES = __FILES__;";
    const a = serviceWorkerSource(template, [file('index.html'), file('assets/a.js'), file('sw.js')]);
    expect(a).toContain('["/assets/a.js","/index.html"]');
    expect(serviceWorkerSource(template, [file('assets/a.js'), file('index.html')])).toBe(a);
    expect(serviceWorkerSource(template, [file('index.html'), file('assets/a.js', 'changed')])).not.toBe(a);
  });
});
