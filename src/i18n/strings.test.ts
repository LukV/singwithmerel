import { describe, expect, it } from 'vitest';
import { STRINGS } from './strings';
import { LANGS } from './langs';

describe('strings', () => {
  it('names the notes per language', () => {
    expect(STRINGS.en.noteNames.join(' ')).toBe('do re mi fa sol la ti do');
    expect(STRINGS.fr.noteNames.join(' ')).toBe('do ré mi fa sol la si do');
    expect(STRINGS.nl.noteNames.join(' ')).toBe('do re mi fa sol la si do');
  });

  it('shows letter names in English and Dutch, not in French', () => {
    expect(STRINGS.en.showLetters).toBe(true);
    expect(STRINGS.nl.showLetters).toBe(true);
    expect(STRINGS.fr.showLetters).toBe(false);
  });

  it('has four exercises and every string filled in every language', () => {
    for (const lang of LANGS) {
      const s = STRINGS[lang];
      expect(s.exercises).toHaveLength(4);
      for (const [key, value] of Object.entries(s)) {
        if (typeof value === 'string') expect(value, `${lang}.${key}`).not.toBe('');
      }
    }
  });
});
