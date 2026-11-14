import { playTone } from '../audio/tone';
import { SCALE } from '../melody/scale';
import { keyPressed } from '../round/controller';
import { lit, plays } from '../state';

/** Play a note of the scale on the instrument: its tone, its dot on the key, its mark on the staff. */
export function playNote(step: number): void {
  const note = SCALE[step];
  if (!note) return;
  playTone(note.freq);
  lit.value = step;
  plays.value++;
  keyPressed(step);
}

/** The scale step a key press plays: A S D F G H J K by letter, or by position on the keyboard. */
export function stepForKey(key: string, code: string): number | null {
  const byLetter = 'asdfghjk'.indexOf(key.toLowerCase());
  if (key.length === 1 && byLetter >= 0) return byLetter;
  // On AZERTY and other layouts, the home row still plays the scale.
  const byCode = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'].indexOf(code);
  return byCode >= 0 ? byCode : null;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function onKeyDown(e: KeyboardEvent): void {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e.target)) return;
  const step = stepForKey(e.key, e.code);
  if (step === null) return;
  e.preventDefault();
  playNote(step);
}
