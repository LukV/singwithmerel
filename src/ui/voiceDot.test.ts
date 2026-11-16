import { describe, expect, it } from 'vitest';
import { voiceStep } from './voiceDot';

describe('the voice dot', () => {
  it('sits on the note sung, in any octave', () => {
    expect(voiceStep(0, 0)).toBe(0);
    expect(voiceStep(400, 2)).toBe(2);
    expect(voiceStep(400 - 1200, 2)).toBe(2); // an octave below
    expect(voiceStep(700 + 1200, 4)).toBe(4); // an octave above
  });

  it('sits between notes when the voice is between them', () => {
    expect(voiceStep(100, 0)).toBeCloseTo(0.5);
    expect(voiceStep(450, 2)).toBeCloseTo(2.5); // a quarter tone above mi, halfway to fa
  });

  it('stays near the note to sing across the octave line', () => {
    expect(voiceStep(1150, 7)).toBeCloseTo(6.5); // just under high do
    expect(voiceStep(-50, 0)).toBeCloseTo(-0.5); // just under low do
  });
});
