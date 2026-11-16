import { SCALE_DOWN, SCALE_UP, randomMelody, type Melody } from '../melody/melody';

/**
 * One round, as a small state machine (docs/product/0020-features.md#One round).
 *
 * Singing (levels 1 to 3): Listen is Merel singing, which never counts (`preview`). Sing is a
 * switch: on, it is your turn (`turn`). When Merel listens (`listen`), each note found counts
 * (`sung`), and the last one completes the round (done). A wrong note (`wrong`) resets nothing:
 * you try that step again. A long silence (`missed`), or Listen (`again`), starts again from do,
 * as often as you like. When he does not listen, or stops being able to (`deaf`), Sing turned off
 * again (`finished`) completes the round (docs/architecture/decisions/018-listen-and-sing.md).
 * Recognition (level 4): Listen starts it: hear → direction (up or down, per step) → find (the
 * notes on the keys) → done. A wrong answer is shown and tried again; it never resets the round.
 */

export type Phase = 'preview' | 'hear' | 'turn' | 'direction' | 'find' | 'done';

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
  /** Singing, while Merel listens: how many notes of the melody were found so far. */
  sung: number;
  /** Singing, while Merel listens: wrong notes and misses so far, whether the last was a miss (sing from do), or a wrong note (try the step again). */
  tries: number;
  missed: boolean;
  off: boolean;
  /** The last wrong answer, shown until the next answer. */
  wrong: null | { kind: 'direction' } | { kind: 'note'; step: number };
}

export type RoundEvent =
  | { type: 'played' }
  | { type: 'answer'; up: boolean }
  | { type: 'key'; step: number }
  /** Merel heard the next note of the melody. */
  | { type: 'sung' }
  /** A wrong note was held: nothing resets. */
  | { type: 'wrong' }
  /** A long silence ended a try before all notes were found: from do again. */
  | { type: 'missed' }
  /** Merel sang it again (Hear it) during Your turn: from do again. */
  | { type: 'again' }
  /** Merel cannot listen after all: refused, missing or failing microphone. */
  | { type: 'deaf' }
  /** Sing turned off while Merel does not listen: you sang it on your own. */
  | { type: 'finished' };

export const RECOGNITION = 4;
export const isRecognition = (level: number) => level === RECOGNITION;

export function melodyFor(level: number, previous: Melody | null = null, random?: () => number): Melody {
  if (level === 1) return SCALE_UP;
  if (level === 2) return SCALE_DOWN;
  return randomMelody(previous, random);
}

export function newRound(level: number, melody: Melody, phase: Phase = isRecognition(level) ? 'hear' : 'turn', listen = false): Round {
  return { level, melody, phase, dir: 0, found: 0, listen: listen && !isRecognition(level), sung: 0, tries: 0, missed: false, off: false, wrong: null };
}

/** Whether the step after note `i` goes up. */
export const goesUp = (melody: Melody, i: number) => melody[i + 1]!.step > melody[i]!.step;

/** The next state, and whether this event completed the round (a dot fills). */
export function advance(round: Round, event: RoundEvent): { round: Round; completed: boolean } {
  const stay = { round, completed: false };
  switch (round.phase) {
    case 'hear':
      if (event.type !== 'played' || !isRecognition(round.level)) return stay;
      return { round: { ...round, phase: 'direction' }, completed: false };
    case 'turn': {
      if (!round.listen) return event.type === 'finished' ? { round: { ...round, phase: 'done' }, completed: true } : stay;
      if (event.type === 'deaf') return { round: { ...round, listen: false, sung: 0, missed: false, off: false }, completed: false };
      if (event.type === 'missed') return { round: { ...round, sung: 0, tries: round.tries + 1, missed: true, off: false }, completed: false };
      if (event.type === 'wrong') return { round: { ...round, tries: round.tries + 1, missed: false, off: true }, completed: false };
      if (event.type === 'again') return { round: { ...round, sung: 0, missed: false, off: false }, completed: false };
      if (event.type !== 'sung') return stay;
      const sung = round.sung + 1;
      const done = sung >= round.melody.length;
      return { round: { ...round, sung, missed: false, off: false, phase: done ? 'done' : 'turn' }, completed: done };
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
