import { describe, expect, it } from 'vitest';
import { BEAT, clipName } from './voice';

describe("Merel's clips", () => {
  it('are named by syllable and pitch', () => {
    expect(clipName(0, 'named', 'fr')).toBe('do-C4');
    expect(clipName(4, 'named', 'nl')).toBe('sol-G4');
    expect(clipName(7, 'named', 'en')).toBe('do-C5');
    expect(clipName(3, 'du', 'en')).toBe('du-F4');
  });

  it('sing "ti" in English and "si" in French and Dutch', () => {
    expect(clipName(6, 'named', 'en')).toBe('ti-B4');
    expect(clipName(6, 'named', 'fr')).toBe('si-B4');
    expect(clipName(6, 'named', 'nl')).toBe('si-B4');
  });

  it('are a beat apart at 90 per minute', () => {
    expect(BEAT).toBeCloseTo(0.667, 3);
  });
});
