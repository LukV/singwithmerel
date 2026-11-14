import { describe, expect, it } from 'vitest';
import { langFromBrowser, langFromPath, pickLang } from './langs';

describe('choosing the language', () => {
  it('reads the path', () => {
    expect(langFromPath('/fr/')).toBe('fr');
    expect(langFromPath('/nl')).toBe('nl');
    expect(langFromPath('/')).toBeNull();
    expect(langFromPath('/de/')).toBeNull();
  });

  it('follows the browser on a first visit', () => {
    expect(langFromBrowser(['nl-BE', 'en'])).toBe('nl');
    expect(langFromBrowser(['de-DE', 'fr-FR'])).toBe('fr');
    expect(langFromBrowser(['de-DE'])).toBe('en');
  });

  it('prefers the path, then the stored choice, then the browser', () => {
    expect(pickLang('/fr/', 'nl', ['en'])).toBe('fr');
    expect(pickLang('/', 'nl', ['fr'])).toBe('nl');
    expect(pickLang('/', null, ['fr-CA'])).toBe('fr');
  });
});
