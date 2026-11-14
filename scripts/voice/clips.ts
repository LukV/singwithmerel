import { SCALE } from '../../src/melody/scale.ts';

/**
 * The 17 clips Merel sings from (docs/reference/0010-voice-clips.md): the eight notes on their
 * names, "ti" for English, and the eight notes on "du"; each with the frequency it must have.
 */
const NAMED = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do'];

export const CLIPS: { name: string; hz: number }[] = [
  ...SCALE.map((n, i) => ({ name: `${NAMED[i]}-${n.pitch}`, hz: n.freq })),
  { name: `ti-${SCALE[6]!.pitch}`, hz: SCALE[6]!.freq },
  ...SCALE.map((n) => ({ name: `du-${n.pitch}`, hz: n.freq })),
];

/** The most a clip may be off its note, in cents. */
export const TOLERANCE = 10;
/** The latest a clip's sound may start, in seconds, for it to stay on the beat. */
export const LATEST_ONSET = 0.02;

export interface Verdict {
  name: string;
  hz: number | null;
  cents: number | null;
  onset: number;
  ok: boolean;
  problem?: string;
}
