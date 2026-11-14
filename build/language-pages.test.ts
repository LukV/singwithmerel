import { describe, expect, it } from 'vitest';
import { localise } from './language-pages';
import { cleanSvg } from './svg-clean';

describe('the language pages', () => {
  it('set the language, title and description', () => {
    const html = '<html lang="en"><head><meta name="description" content="x" /><title>t</title></head></html>';
    const fr = localise(html, 'fr');
    expect(fr).toContain('<html lang="fr"');
    expect(fr).toContain('<title>Merel : chante avec Merel</title>');
    expect(fr).toContain('Apprends à chanter');
  });
});

describe('cleaned SVGs', () => {
  it('lose their metadata and size, and take the ink colour on request', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10" role="img" aria-label="x" xmlns:c2pa="u"><path stroke="#121212"/><metadata>blob</metadata></svg>';
    const out = cleanSvg(svg, true);
    expect(out).not.toMatch(/metadata|c2pa|width=|role=/);
    expect(out).toContain('viewBox="0 0 10 10"');
    expect(out).toContain('stroke="currentColor"');
    expect(cleanSvg(svg, false)).toContain('stroke="#121212"');
  });
});
