import { SCALE, noteColour } from '../melody/scale';
import { cards, t, type CardState } from '../state';
import { HandRule } from './HandRule';
import { Merel, type Pose } from './merel/Merel';

/** Merel's pose on each card while it is not completed; pitch 1.2 makes it follow the round. */
const POSES: Pose[] = ['singing', 'thinking', 'waiting', 'listening'];
const DOTS = 5;
const CARD_VIEWBOX = '20 -40 280 378';

export function Lesson() {
  return (
    <div class="lesson">
      <HandRule direction="vertical" class="lesson__path" strokeWidth={3} wobble={1.6} seed={11} />
      {cards.value.map((state, i) => (
        <Card key={i} n={i + 1} state={state} />
      ))}
    </div>
  );
}

function Card({ n, state }: { n: number; state: CardState }) {
  const s = t.value;
  const ex = s.exercises[n - 1]!;
  const done = state === 'completed';
  const active = state === 'active';
  return (
    <section id={`c${n}`} class={`card card--${state}`} data-state={state} aria-labelledby={`c${n}-title`}>
      <div class="card__node" aria-hidden="true">
        {done ? (
          <svg viewBox="0 0 80 80">
            <path d="M17.8 42.2 Q34.3 58.2 48.1 40.1 L62.0 22.0" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        ) : (
          <span>{n}</span>
        )}
      </div>
      <div class="card__body">
        <div class="card__top">
          <div class="card__words">
            <div class="card__heading">
              <h2 id={`c${n}-title`} class="card__title lettering">
                <span class="visually-hidden">{s.exercise(n)}</span>
                {ex.title}
              </h2>
              {active && <HandRule class="card__underline" strokeWidth={5} wobble={1.4} seed={20 + n} />}
            </div>
            <p class="card__text">{ex.text}</p>
          </div>
          <Merel class="card__merel" pose={done ? 'bowing' : POSES[n - 1]!} live={active} viewBox={CARD_VIEWBOX} />
        </div>
        <div class="card__dots">
          {Array.from({ length: DOTS }, (_, k) => (
            <span
              key={k}
              class={`dot${done ? ' dot--on' : ''}`}
              style={done ? { '--dot': noteColour(SCALE[k]!) } : undefined}
              aria-hidden="true"
            />
          ))}
          <span class="card__status lettering" aria-live="polite">
            {done ? s.done : ''}
          </span>
        </div>
        <div class="card__buttons">
          <button type="button" class={`button${active ? ' button--filled' : ''}`}>
            {done ? s.cardAgain : s.cardStart}
          </button>
          <button type="button" class="button">
            {s.hearIt}
          </button>
        </div>
      </div>
    </section>
  );
}
