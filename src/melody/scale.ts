/** The do major scale from low do (C4) to high do (C5): the eight notes the instrument plays. */

export type NoteKey = 'do' | 're' | 'mi' | 'fa' | 'sol' | 'la' | 'si';

export interface ScaleNote {
  /** Position in the scale, 0 for low do to 7 for high do; also diatonic steps above C4. */
  readonly step: number;
  /** The note's solfege identity, which names its colour token. High do shares do's. */
  readonly key: NoteKey;
  /** Scientific pitch, as the voice clips are named. */
  readonly pitch: string;
  /** Letter name. */
  readonly letter: string;
  /** Frequency in Hz, equal temperament, A4 = 440 Hz. */
  readonly freq: number;
  /** The computer key that plays it. */
  readonly kbd: string;
}

const KEYS: NoteKey[] = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do'];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
const SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12];
const KBD = 'asdfghjk';

/** Frequency of a note `semitones` above C4, with A4 = 440 Hz. */
export function freqFromC4(semitones: number): number {
  return 440 * 2 ** ((semitones - 9) / 12);
}

export const SCALE: readonly ScaleNote[] = KEYS.map((key, step) => ({
  step,
  key,
  pitch: `${LETTERS[step]}${step === 7 ? 5 : 4}`,
  letter: LETTERS[step]!,
  freq: freqFromC4(SEMITONES[step]!),
  kbd: KBD[step]!,
}));

/** The CSS custom property that holds a note's colour. */
export function noteColour(note: ScaleNote): string {
  return `var(--note-${note.key})`;
}
