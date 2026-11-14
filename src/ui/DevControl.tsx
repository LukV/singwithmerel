import { useState } from 'preact/hooks';
import { cards, type CardState } from '../state';

const STATES: CardState[] = ['active', 'upcoming', 'completed'];

/**
 * Development only (`npm run dev`): sets each card's state, so the three states can be checked
 * before pitch 1.2 makes them follow progress. Not in the build.
 */
export function DevControl() {
  const [open, setOpen] = useState(false);
  return (
    <div class="dev">
      <button type="button" class="dev__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        dev
      </button>
      {open && (
        <fieldset class="dev__panel">
          <legend>Card states</legend>
          {cards.value.map((state, i) => (
            <label key={i}>
              {i + 1}{' '}
              <select
                value={state}
                data-card={i + 1}
                onChange={(e) => {
                  const next = [...cards.value];
                  next[i] = (e.currentTarget as HTMLSelectElement).value as CardState;
                  cards.value = next;
                }}
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
