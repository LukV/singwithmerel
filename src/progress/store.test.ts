import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY, empty, normalise, readProgress, writeProgress } from './store';
import { decodeProgress, encodeProgress } from './code';

describe('the progress record', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(readProgress()).toEqual(empty());
  });

  it('remembers the language and the levels', () => {
    writeProgress({ lang: 'fr', levels: { 1: { dots: 2 } } });
    expect(readProgress().lang).toBe('fr');
    expect(readProgress().levels[1]).toEqual({ dots: 2 });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1);
  });

  it('ignores a damaged record', () => {
    localStorage.setItem(STORAGE_KEY, '{nope');
    expect(readProgress()).toEqual(empty());
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, lang: 'de' }));
    expect(readProgress().lang).toBeUndefined();
  });

  it('reads the pitch-1.1 record, which had only the language', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, lang: 'nl' }));
    expect(readProgress()).toEqual({ ...empty(), lang: 'nl' });
  });

  it('cleans what it reads', () => {
    expect(normalise({ version: 1, levels: { 1: { dots: 9 }, 7: { dots: 1 } }, skipped: [2, 2, 9] })).toEqual({
      version: 1,
      levels: { 1: { dots: 5, done: true } },
      skipped: [2],
    });
  });
});

describe('the progress code', () => {
  const progress = { ...empty(), lang: 'nl' as const, levels: { 1: { dots: 5, done: true }, 2: { dots: 2 } }, skipped: [3] };

  it('goes there and back', async () => {
    const code = await encodeProgress(progress);
    expect(code).toMatch(/^m[01]\.[A-Za-z0-9_-]+$/);
    expect(await decodeProgress(code)).toEqual({ version: 1, levels: progress.levels, skipped: [3] });
  });

  it('is short', async () => {
    expect((await encodeProgress(progress)).length).toBeLessThan(120);
  });

  it('survives spaces and line breaks from pasting', async () => {
    const code = await encodeProgress(progress);
    const pasted = ` ${code.slice(0, 10)}\n${code.slice(10)} `;
    expect(await decodeProgress(pasted)).not.toBeNull();
  });

  it('turns down a damaged code', async () => {
    expect(await decodeProgress('hello')).toBeNull();
    expect(await decodeProgress('m1.AAAA')).toBeNull();
    const code = await encodeProgress(progress);
    expect(await decodeProgress(code.slice(0, -6))).toBeNull();
  });
});
