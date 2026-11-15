import { SCALE_DOWN, SCALE_UP, randomMelody, type Melody } from '../melody/melody';

/**
 * One round, as a small state machine (docs/product/0020-features.md#One round).
 *
 * Singing (levels 1 to 3): hear → along → turn. When Merel listens (`listen`), Your turn earns
 * the dot: each note heard counts (`sung`), and the last one completes the round (done). When he
 * does not, or stops being able to (`deaf`), the round completes after Sing along, and Your turn
 * is practice (docs/architecture/decisions/014-your-turn-earns-the-dot.md).
 * Recognition (level 4): hear → direction (up or down, per step) → find (the notes on the keys)
 * → done. A wrong answer is shown and tried again; it never resets the round.
 * `preview` is "Hear it" on a card that is not running: Merel sings, nothing counts.
 */

export type Phase = 'preview' | 'hear' | 'along' | 'turn' | 'direction' | 'find' | 'done';

export interface Round {
  level: number;
  melody: Melody;
  phase: Phase;
  /** Recognition: which step's direction is asked, 0 (first to second note) or 1. */
  dir: number;
  /** Recognition: how many notes have been found on the keys. */
  found: number;
  /** Singing: whether Merel listens in Your turn. */
  listen: boolean;
  /** Singing, while Merel listens: how many notes of the melody were heard so far. */
  sung: number;
  /** The last wrong answer, shown until the next answer. */
  wrong: null | { kind: 'direction' } | { kind: 'note'; step: number };
}

export type RoundEvent =
  | { type: 'played' }
  | { type: 'answer'; up: boolean }
  | { type: 'key'; step: number }
  /** Merel heard the next note of the melody. */
  | { type: 'sung' }
  /** Merel cannot listen after all: refused, missing or failing microphone. */
  | { type: 'deaf' };

export const RECOGNITION = 4;
export const isRecognition = (level: number) => level === RECOGNITION;

export function melodyFor(level: number, previous: Melody | null = null, random?: () => number): Melody {
  if (level === 1) return SCALE_UP;
  if (level === 2) return SCALE_DOWN;
  return randomMelody(previous, random);
}

export function newRound(level: number, melody: Melody, phase: Phase = 'hear', listen = false): Round {
  return { level, melody, phase, dir: 0, found: 0, listen: listen && !isRecognition(level), sung: 0, wrong: null };
}

/** Whether the step after note `i` goes up. */
export const goesUp = (melody: Melody, i: number) => melody[i + 1]!.step > melody[i]!.step;

/** The next state, and whether this event completed the round (a dot fills). */
export function advance(round: Round, event: RoundEvent): { round: Round; completed: boolean } {
  const stay = { round, completed: false };
  switch (round.phase) {
    case 'hear':
      if (event.type !== 'played') return stay;
      return { round: { ...round, phase: isRecognition(round.level) ? 'direction' : 'along' }, completed: false };
    case 'along':
      if (event.type !== 'played') return stay;
      return { round: { ...round, phase: 'turn' }, completed: !round.listen };
    case 'turn': {
      if (!round.listen) return stay;
      if (event.type === 'deaf') return { round: { ...round, listen: false }, completed: true };
      if (event.type !== 'sung') return stay;
      const sung = round.sung + 1;
      const done = sung >= round.melody.length;
      return { round: { ...round, sung, phase: done ? 'done' : 'turn' }, completed: done };
    }
    case 'direction': {
      if (event.type !== 'answer') return stay;
      if (event.up !== goesUp(round.melody, round.dir)) return { round: { ...round, wrong: { kind: 'direction' } }, completed: false };
      const dir = round.dir + 1;
      const done = dir >= round.melody.length - 1;
      return { round: { ...round, dir, wrong: null, phase: done ? 'find' : 'direction' }, completed: false };
    }
    case 'find': {
      if (event.type !== 'key') return stay;
      if (round.melody[round.found]!.step !== event.step) return { round: { ...round, wrong: { kind: 'note', step: event.step } }, completed: false };
      const found = round.found + 1;
      const done = found >= round.melody.length;
      return { round: { ...round, found, wrong: null, phase: done ? 'done' : 'find' }, completed: done };
    }
    default:
      return stay;
  }
}
