import { computed } from '@preact/signals';
import { SCALE_UP } from '../melody/melody';
import { round, sounding } from '../round/controller';
import { lit } from '../state';

/**
 * What the staff shows: the notes, with their rhythm, and how each is marked.
 * - plain: drawn in white;
 * - on: sounding now, or just played, in its colour with the dashes around it;
 * - found: found, in recognition or while Merel listens, in its colour;
 * - next, waiting: while Merel listens, the note to sing and those after it, outlined;
 * - hidden: not shown yet (recognition, until the note is found).
 * A wrong key in recognition shows as a `ghost` in its colour where the next note goes.
 */

export type Mark = 'plain' | 'on' | 'found' | 'next' | 'waiting' | 'hidden';

export interface StaffNote {
  step: number;
  beats: number;
  /** The beat it starts on. */
  beat: number;
  mark: Mark;
}

export interface StaffView {
  notes: StaffNote[];
  beats: number;
  ghost: { beat: number; step: number } | null;
  /** The beat to keep in view on a phone. */
  focus: number | null;
}

export const staffView = computed<StaffView>(() => {
  const r = round.value;
  const now = sounding.value;
  const melody = r ? r.melody : SCALE_UP;
  let beat = 0;
  const notes: StaffNote[] = melody.map((n, i) => {
    let mark: Mark = 'plain';
    if (!r) mark = lit.value === n.step ? 'on' : 'plain';
    else if (now === i) mark = 'on';
    else if (r.phase === 'direction') mark = 'hidden';
    else if (r.phase === 'find') mark = i < r.found ? 'found' : 'hidden';
    else if (r.phase === 'done') mark = 'found';
    else if (r.phase === 'turn' && r.listen) mark = i < r.sung ? 'found' : i === r.sung ? 'next' : 'waiting';
    const note = { step: n.step, beats: n.beats, beat, mark };
    beat += n.beats;
    return note;
  });
  // While recognition is still a puzzle, Merel's singing does not give the notes away.
  if (r && (r.phase === 'direction' || r.phase === 'find')) {
    notes.forEach((n, i) => {
      if (n.mark === 'on') n.mark = r.phase === 'find' && i < r.found ? 'found' : 'hidden';
    });
  }
  const wrong = r?.phase === 'find' && r.wrong?.kind === 'note' ? r.wrong.step : null;
  const ghost = wrong !== null && r ? { beat: notes[r.found]!.beat, step: wrong } : null;
  const on = notes.find((n) => n.mark === 'on');
  const listening = r?.phase === 'turn' && r.listen ? notes[Math.min(r.sung, notes.length - 1)]!.beat : null;
  const focus = on?.beat ?? ghost?.beat ?? (r?.phase === 'find' ? notes[Math.max(0, r.found - 1)]!.beat : listening);
  return { notes, beats: beat, ghost, focus };
});
