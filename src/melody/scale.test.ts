import { describe, expect, it } from 'vitest';
import { SCALE, freqFromC4 } from './scale';

describe('the do major scale', () => {
  it('has eight notes from C4 to C5', () => {
    expect(SCALE.map((n) => n.pitch)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);
  });

  it('is tuned to A4 = 440 Hz', () => {
    expect(freqFromC4(9)).toBe(440);
    expect(SCALE[0]!.freq).toBeCloseTo(261.63, 2);
    expect(SCALE[4]!.freq).toBeCloseTo(392.0, 2);
    expect(SCALE[7]!.freq).toBeCloseTo(523.25, 2);
  });

  it('is played by A S D F G H J K', () => {
    expect(SCALE.map((n) => n.kbd).join('')).toBe('asdfghjk');
  });

  it('gives high do the colour of do', () => {
    expect(SCALE[7]!.key).toBe('do');
  });
});
