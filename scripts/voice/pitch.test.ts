import { describe, expect, it } from 'vitest';
import { CLIPS } from './clips';
import { cents, measure } from './pitch';
import { readWav, writeWav } from './wav';

const RATE = 48_000;

/** A sung-like clip: silence, a short attack, a sustained tone with harmonics, a fade. */
function clip(hz: number, { silence = 0, seconds = 1.2, vibrato = 0 } = {}) {
  const samples = new Float32Array(Math.round((silence + seconds) * RATE));
  let phase = 0;
  for (let i = Math.round(silence * RATE); i < samples.length; i++) {
    const t = i / RATE - silence;
    const f = hz * 2 ** ((vibrato * Math.sin(2 * Math.PI * 5 * t)) / 1200);
    phase += (2 * Math.PI * f) / RATE;
    const envelope = Math.min(1, t / 0.03) * Math.min(1, (seconds - t) / 0.15);
    samples[i] = 0.5 * envelope * (Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase));
  }
  return { rate: RATE, samples };
}

describe('the clip check', () => {
  it('knows the 17 clips', () => {
    expect(CLIPS).toHaveLength(17);
    expect(CLIPS.map((c) => c.name)).toEqual(expect.arrayContaining(['do-C4', 'si-B4', 'ti-B4', 'do-C5', 'du-G4']));
  });

  it('measures every note of the scale within a cent, and an octave down too', () => {
    for (const c of CLIPS.slice(0, 8)) {
      for (const target of [c.hz, c.hz / 2]) {
        const m = measure(clip(target), target);
        expect(Math.abs(cents(m.hz!, target))).toBeLessThan(1);
      }
    }
  });

  it('finds a clip 20 cents sharp, through a WAV file and a little vibrato', () => {
    const sharp = 392 * 2 ** (20 / 1200);
    const sound = readWav(writeWav(clip(sharp, { vibrato: 8 })));
    expect(cents(measure(sound, 392).hz!, 392)).toBeCloseTo(20, 0);
  });

  it('says when the sound starts', () => {
    expect(measure(clip(262, { silence: 0.1 }), 262).onset).toBeCloseTo(0.1, 2);
    expect(measure(clip(262), 262).onset).toBeLessThan(0.005);
  });

  it('finds no pitch in silence', () => {
    expect(measure({ rate: RATE, samples: new Float32Array(RATE) }, 262).hz).toBeNull();
  });
});
