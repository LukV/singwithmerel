import { useRef } from 'preact/hooks';
import { SCALE, noteColour } from '../melody/scale';
import { dockOpen, lit, started, t } from '../state';
import { Keys } from './Keys';
import { Staff } from './Staff';

/** How far a finger must move on the handle to count as a swipe rather than a tap. */
const SWIPE = 24;

export function Instrument({ compact }: { compact: boolean }) {
  const s = t.value;
  const current = lit.value;
  const note = current === null ? null : SCALE[current]!;
  const open = !compact || dockOpen.value;
  const startY = useRef<number | null>(null);

  const head = (
    <>
      <span class="instrument__label">{s.instrument}</span>
      <span class="instrument__note lettering" aria-live="polite">
        {note && <span class="dot dot--on" style={{ '--dot': noteColour(note) }} aria-hidden="true" />}
        {note ? s.noteNames[note.step] : ''}
      </span>
    </>
  );

  return (
    <aside class={`instrument${started.value ? ' is-up' : ''}${open ? '' : ' is-collapsed'}`} aria-label={s.instrument}>
      <div class="instrument__inner">
        {compact ? (
          // On a phone the head is a handle: tap, or swipe down and up, to tuck the instrument away and back.
          <button
            type="button"
            class="instrument__head instrument__handle"
            aria-expanded={open}
            aria-controls="instrument-body"
            title={open ? s.dockHide : s.dockShow}
            onPointerDown={(e) => {
              startY.current = e.clientY;
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
            onPointerUp={(e) => {
              const dy = e.clientY - (startY.current ?? e.clientY);
              startY.current = null;
              dockOpen.value = dy > SWIPE ? false : dy < -SWIPE ? true : !dockOpen.value;
            }}
            onPointerCancel={() => {
              startY.current = null;
            }}
            onClick={(e) => {
              // Pointer presses are handled on pointer up; this is Enter or Space.
              if (e.detail === 0) dockOpen.value = !dockOpen.value;
            }}
          >
            <span class="visually-hidden">{open ? s.dockHide : s.dockShow}</span>
            {head}
          </button>
        ) : (
          <div class="instrument__head">{head}</div>
        )}
        <div id="instrument-body" class="instrument__body" inert={!open}>
          <Staff compact={compact} />
          <div class="instrument__play">
            <Keys />
            <p class="instrument__help">{s.instrumentHelp}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
