import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY, readProgress, writeProgress } from './store';

describe('the progress record', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(readProgress()).toEqual({ version: 1 });
  });

  it('remembers the language', () => {
    writeProgress({ lang: 'fr' });
    expect(readProgress().lang).toBe('fr');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1);
  });

  it('ignores a damaged record', () => {
    localStorage.setItem(STORAGE_KEY, '{nope');
    expect(readProgress()).toEqual({ version: 1 });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, lang: 'de' }));
    expect(readProgress().lang).toBeUndefined();
  });
});
