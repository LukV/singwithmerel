import { useState } from 'preact/hooks';
import { completeRound } from '../progress/levels';
import { empty } from '../progress/store';
import { stop } from '../round/controller';
import { progress, setProgress } from '../state';

/**
 * Development only (`npm run dev`): fill a dot on a level, or start over, so levels can be
 * checked without singing every round. Not in the build.
 */
export function DevControl() {
  const [open, setOpen] = useState(false);
  return (
    <div class="dev">
      {open && (
        <fieldset class="dev__panel">
          <legend>Progress</legend>
          {[1, 2, 3, 4].map((level) => (
            <button key={level} type="button" onClick={() => setProgress(completeRound(progress.value, level).progress)}>
              + dot on {level} ({progress.value.levels[level]?.dots ?? 0})
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              stop();
              setProgress(empty());
            }}
          >
            start over
          </button>
        </fieldset>
      )}
      <button type="button" class="dev__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        dev
      </button>
    </div>
  );
}
