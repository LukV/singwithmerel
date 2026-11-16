import { Fragment } from 'preact';
import { SCALE, noteColour } from '../melody/scale';
import { dotsOf, isDone, isSkipped, type LevelState } from '../progress/levels';
import { DOTS } from '../progress/store';
import { canListen } from '../listen/mic';
import { micChoice } from '../listen/listening';
import { answer, answerAsk, askAgain, asking, bowing, hear, isSinging, listenNote, nodding, round, singing, skip, toggleSing } from '../round/controller';
import { goesUp, isRecognition, type Round } from '../round/round';
import { cards, progress, t } from '../state';
import { HandRule } from './HandRule';
import { Merel, type Pose } from './merel/Merel';
import { InstallInvite } from './InstallInvite';
import { ProgressPanel } from './ProgressPanel';
import { pathFor } from '../i18n/langs';
import { lang } from '../state';

const CARD_VIEWBOX = '20 -40 280 378';
/** After this many wrong notes or misses, Merel offers Hear it. */
const OFFER_HEAR = 2;

export function Lesson() {
  return (
    <div class="lesson">
      <HandRule direction="vertical" class="lesson__path" strokeWidth={3} wobble={1.6} seed={11} />
      {cards.value.map((state, i) => (
        <Fragment key={i}>
          {state === 'active' && <InstallInvite />}
          <Card level={i + 1} state={state} />
        </Fragment>
      ))}
      {!cards.value.includes('active') && <InstallInvite />}
      <ProgressPanel />
      <footer class="lesson__foot">
        <a href={pathFor(lang.value, 'privacy')}>{t.value.privacyLink}</a>
      </footer>
    </div>
  );
}

/** Merel's pose follows the round: singing while he sings, thinking over up or down, listening while you sing or search, bowing when a round completes. */
function poseFor(state: LevelState, mine: Round | null): Pose {
  if (mine) {
    if (bowing.value || mine.phase === 'done') return 'bowing';
    if (singing.value) return 'singing';
    if (mine.phase === 'turn' || mine.phase === 'find') return 'listening';
    if (mine.phase === 'direction') return 'thinking';
    return 'singing';
  }
  return state === 'completed' ? 'bowing' : 'waiting';
}

function statusFor(mine: Round | null, levelDone: boolean): string {
  const s = t.value;
  if (!mine) return '';
  switch (mine.phase) {
    case 'preview':
    case 'hear':
      return s.status.listen;
    case 'turn':
      if (bowing.value) return s.status.bravo;
      if (!mine.listen || asking.value) return s.status.turn;
      if (mine.missed || mine.off) {
        if (mine.tries >= OFFER_HEAR) return s.status.hearAgain(s.noteNames[mine.melody[0]!.step]!);
        const name = s.noteNames[mine.melody[mine.sung]!.step]!;
        return mine.missed ? s.status.missed(name) : s.status.wrongSung(name);
      }
      return s.status.turnListening;
    case 'direction':
      return mine.wrong ? s.status.wrongDirection : s.status.direction(mine.dir);
    case 'find':
      return mine.wrong?.kind === 'note' ? s.status.wrongNote(s.noteNames[mine.wrong.step]!) : s.status.find(mine.found);
    case 'done':
      return levelDone ? s.status.levelDone : s.status.bravo;
    default:
      return '';
  }
}

function Card({ level, state }: { level: number; state: LevelState }) {
  const s = t.value;
  const p = progress.value;
  const ex = s.exercises[level - 1]!;
  const r = round.value;
  const mine = r && r.level === level ? r : null;
  const running = !!mine;
  const completed = state === 'completed';
  const active = state === 'active';
  const done = isDone(p, level);
  const dots = dotsOf(p, level);
  const pose = poseFor(state, mine);
  const status = mine ? statusFor(mine, done) : completed ? (done ? s.done : s.skipped) : '';
  const singingLevel = !isRecognition(level);
  const singingNow = singing.value;
  const sing = isSinging(level);
  const upcoming = state === 'upcoming';
  const ask = running && singingLevel && mine.phase === 'turn' && asking.value;
  const note = running && singingLevel ? listenNote.value : null;
  // After a no, a quiet way to let Merel listen after all, on the card you are on.
  const again = singingLevel && !upcoming && micChoice.value === 'no' && note !== 'later' && canListen();
  // Two wrong notes or misses: Hear it is the button to press.
  const offerHear = running && mine.phase === 'turn' && mine.listen && (mine.missed || mine.off) && mine.tries >= OFFER_HEAR;

  return (
    <section id={`c${level}`} class={`card card--${state}${running ? ' is-running' : ''}`} data-state={state} aria-labelledby={`c${level}-title`}>
      <div class="card__node" aria-hidden="true">
        {completed ? (
          <svg viewBox="0 0 80 80">
            <path d="M17.8 42.2 Q34.3 58.2 48.1 40.1 L62.0 22.0" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        ) : (
          <span>{level}</span>
        )}
      </div>
      <div class="card__body">
        <div class="card__top">
          <div class="card__words">
            <div class="card__heading">
              <h2 id={`c${level}-title`} class="card__title lettering">
                <span class="visually-hidden">{s.exercise(level)}</span>
                {ex.title}
              </h2>
              {active && <HandRule class="card__underline" strokeWidth={5} wobble={1.4} seed={20 + level} />}
            </div>
            <p class="card__text">{ex.text}</p>
          </div>
          <Merel class={`card__merel${mine && nodding.value ? ' is-nodding' : ''}`} pose={pose} live={active || !!mine} viewBox={CARD_VIEWBOX} />
        </div>
        <div class="card__dots">
          <span class="visually-hidden">{s.dotsLabel(dots, DOTS)}</span>
          {Array.from({ length: DOTS }, (_, k) => (
            <span key={k} class={`dot${k < dots ? ' dot--on' : ''}`} style={k < dots ? { '--dot': noteColour(SCALE[k]!) } : undefined} aria-hidden="true" />
          ))}
          <span class="card__status lettering" aria-live="polite">
            {status}
          </span>
        </div>
        {ask && (
          <div class="card__ask">
            <p class="card__ask-text">{s.listen.ask}</p>
            <div class="card__ask-buttons">
              <button type="button" class="button button--filled" onClick={() => answerAsk(true)}>
                {s.listen.yes}
              </button>
              <button type="button" class="button" onClick={() => answerAsk(false)}>
                {s.listen.no}
              </button>
            </div>
          </div>
        )}
        {note && (
          <p class="card__note" role="status">
            {s.listen[note]}
          </p>
        )}
        {running && isRecognition(level) && mine.phase !== 'hear' && <Trail r={mine} />}
        {running && mine.phase === 'direction' && (
          <div class="card__answers">
            <button type="button" class="button button--big" onClick={() => answer(true)}>
              <span aria-hidden="true">↗</span> {s.up}
            </button>
            <button type="button" class="button button--big" onClick={() => answer(false)}>
              <span aria-hidden="true">↘</span> {s.down}
            </button>
          </div>
        )}
        <div class="card__buttons">
          {/* Listen: the first thing to press on the level you are on, and again after two tries. */}
          <button
            type="button"
            class={`button${offerHear || (active && !mine) ? ' button--filled' : ''}`}
            disabled={upcoming}
            aria-pressed={!!mine && singingNow && (mine.phase === 'preview' || mine.phase === 'hear')}
            onClick={() => hear(level)}
          >
            {s.hearIt}
          </button>
          {singingLevel && (
            <button type="button" class={`button button--switch${sing ? ' button--filled' : ''}`} disabled={upcoming} aria-pressed={sing} onClick={() => toggleSing(level)}>
              <span class="button__light" aria-hidden="true" />
              {s.sing}
            </button>
          )}
        </div>
        {(again || (active && !isSkipped(p, level))) && (
          <div class="card__quiet">
            {active && !isSkipped(p, level) && (
              <button type="button" class="card__skip" onClick={() => skip(level)}>
                {s.skip}
              </button>
            )}
            {again && (
              <button type="button" class="card__skip" onClick={() => void askAgain()}>
                {s.listen.again}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * A recognition round so far: the directions answered, each with a tick, then the three notes,
 * filled in their colour and name as they are found. Colour is never the only cue.
 */
function Trail({ r }: { r: Round }) {
  const s = t.value;
  const finding = r.phase === 'find' || r.phase === 'done';
  return (
    <ol class="card__trail" aria-label={s.answersLabel}>
      {Array.from({ length: r.dir }, (_, i) => {
        const up = goesUp(r.melody, i);
        return (
          <li key={`d${i}`} class="trail__step">
            <span aria-hidden="true">{up ? '↗' : '↘'}</span> {up ? s.up : s.down} <span aria-hidden="true">✓</span>
          </li>
        );
      })}
      {finding &&
        r.melody.map((note, i) =>
          i < r.found ? (
            <li key={`n${i}`} class="trail__note is-found" style={{ '--dot': noteColour(SCALE[note.step]!) }}>
              <span class="trail__dot" aria-hidden="true" />
              {s.noteNames[note.step]}
            </li>
          ) : (
            <li key={`n${i}`} class={`trail__note${i === r.found ? ' is-next' : ''}`}>
              <span aria-hidden="true">?</span>
              <span class="visually-hidden">{s.toFind(i + 1)}</span>
            </li>
          ),
        )}
    </ol>
  );
}
