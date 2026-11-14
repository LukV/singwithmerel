import { SCALE, noteColour } from '../melody/scale';
import { lit, started, t } from '../state';
import { Keys } from './Keys';
import { Staff } from './Staff';

export function Instrument({ compact }: { compact: boolean }) {
  const s = t.value;
  const current = lit.value;
  const note = current === null ? null : SCALE[current]!;
  return (
    <aside class={`instrument${started.value ? ' is-up' : ''}`} aria-label={s.instrument}>
      <div class="instrument__inner">
        <div class="instrument__head">
          <span class="instrument__label">{s.instrument}</span>
          <span class="instrument__note lettering" aria-live="polite">
            {note && <span class="dot dot--on" style={{ '--dot': noteColour(note) }} aria-hidden="true" />}
            {note ? s.noteNames[note.step] : ''}
          </span>
        </div>
        <Staff compact={compact} />
        <div class="instrument__play">
          <Keys />
          <p class="instrument__help">{s.instrumentHelp}</p>
        </div>
      </div>
    </aside>
  );
}
