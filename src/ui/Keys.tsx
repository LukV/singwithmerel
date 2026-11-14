import { SCALE, noteColour } from '../melody/scale';
import { lit, t } from '../state';
import { playNote } from './play';

/** The black keys sit between do-re, re-mi, fa-sol, sol-la and la-si. They do not play. */
const BLACK_AFTER = [0, 1, 3, 4, 5];
/** Slightly different corners and tilts, so the keys look drawn. */
const RADII = ['10px 14px 12px 9px / 12px 9px 14px 10px', '13px 9px 11px 14px / 9px 13px 10px 12px', '9px 12px 14px 10px / 13px 10px 9px 14px', '12px 10px 9px 13px / 10px 14px 12px 9px'];
const TILTS = [-0.8, 0.6, 0.9, 0, -0.7];

export function Keys() {
  const s = t.value;
  const current = lit.value;
  return (
    <div class="keys">
      {SCALE.map((note, i) => {
        const name = s.noteNames[i]!;
        const letter = s.showLetters ? note.letter : null;
        const label = s.keyLabel(i === 7 ? s.highDo : name, letter, note.kbd);
        const on = current === i;
        return (
          <button
            key={i}
            type="button"
            class={`key${on ? ' is-on' : ''}`}
            style={{ borderRadius: RADII[i % 4], '--dot': noteColour(note) }}
            aria-label={label}
            data-note={note.pitch}
            onPointerDown={(e) => {
              if (e.button === 0) playNote(i);
            }}
            onClick={(e) => {
              // Pointer presses already played on pointerdown; this is Enter or Space.
              if (e.detail === 0) playNote(i);
            }}
          >
            <span class="key__dot" aria-hidden="true" />
            <span class="key__name lettering" aria-hidden="true">
              {name}
            </span>
            {letter && (
              <span class="key__letter" aria-hidden="true">
                {letter}
              </span>
            )}
            <span class="key__cap" aria-hidden="true">
              {note.kbd}
            </span>
          </button>
        );
      })}
      {BLACK_AFTER.map((after, k) => (
        <span key={after} class="key-black" style={{ '--after': after + 1, transform: `rotate(${TILTS[k]}deg)` }} aria-hidden="true" />
      ))}
    </div>
  );
}
