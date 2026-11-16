import { fold } from '../listen/judge';

/** Semitones above do of each scale step, and high do. */
const SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12];

/**
 * Where the voice dot sits on the staff, in scale steps above C4 (fractions between notes): the
 * voice is folded into the octave around the note to sing, so a man an octave below, or a child
 * an octave above, sits next to it. A semitone between two scale steps a tone apart is halfway.
 */
export function voiceStep(cents: number, targetStep: number): number {
  const target = SEMITONES[targetStep]! * 100;
  const semitones = (target + fold(cents - target)) / 100;
  const octave = Math.floor(semitones / 12);
  const rest = semitones - 12 * octave;
  let k = 0;
  while (k < 6 && rest > SEMITONES[k + 1]!) k++;
  const step = k + (rest - SEMITONES[k]!) / (SEMITONES[k + 1]! - SEMITONES[k]!);
  return Math.max(-2, Math.min(9, 7 * octave + step));
}
