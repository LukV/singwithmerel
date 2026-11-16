import { batch, effect, signal } from '@preact/signals';
import { audioContext, unlock } from '../audio/tone';
import { preloadVoice, sing, type Performance } from '../audio/voice';
import { askMic, listen, micChoice, muteKey, setMicChoice, stopListening } from '../listen/listening';
import { canListen } from '../listen/mic';
import type { Melody } from '../melody/melody';
import { activeLevel, completeRound, skipLevel } from '../progress/levels';
import { dockOpen, lang, progress, setProgress, started } from '../state';
import { advance, isRecognition, melodyFor, newRound, type Round, type RoundEvent } from './round';

/**
 * Runs rounds: plays Merel's part on the audio clock, follows the note that sounds, fills dots,
 * opens levels. One round at a time; starting another stops the one before.
 */

/** The round on screen, or null. */
export const round = signal<Round | null>(null);
/** The note of the round that sounds now, followed on the audio clock. */
export const sounding = signal<number | null>(null);
/** Merel bows for a moment when a round completes. */
export const bowing = signal(false);
/** Merel nods, softly, at each note you find. */
export const nodding = signal(false);
/** Whether Merel is singing now. */
export const singing = signal(false);
/** Your turn is waiting for the answer to Merel's ask to listen. */
export const asking = signal(false);
/** What the card says about listening, once: he will not listen, he will from the next round, the browser refuses, the microphone failed. */
export const listenNote = signal<'off' | 'later' | 'blocked' | 'failed' | null>(null);

const lastMelody: Record<number, Melody | null> = {};
let performance: Performance | null = null;
let token = 0;
let bowTimer: ReturnType<typeof setTimeout> | undefined;
let nodTimer: ReturnType<typeof setTimeout> | undefined;

const now = () => audioContext()?.currentTime ?? globalThis.performance.now() / 1000;
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function silence(): void {
  token++;
  performance?.stop();
  performance = null;
  batch(() => {
    sounding.value = null;
    singing.value = false;
  });
}

/** Merel sings the round's melody; resolves true when it ended, false when it was stopped. */
async function perform(r: Round, delay = 0.12): Promise<boolean> {
  silence();
  const mine = token;
  singing.value = true;
  const p = await sing(r.melody, isRecognition(r.level) ? 'du' : 'named', lang.value, delay);
  if (mine !== token) {
    p?.stop();
    return false;
  }
  performance = p;
  const end = p?.end ?? now();
  return new Promise((resolve) => {
    const follow = () => {
      if (mine !== token) return resolve(false);
      const time = now();
      sounding.value = p ? p.noteAt(time) : null;
      if (time >= end) {
        batch(() => {
          sounding.value = null;
          singing.value = false;
        });
        performance = null;
        return resolve(true);
      }
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  });
}

function nod(): void {
  clearTimeout(nodTimer);
  nodding.value = true;
  nodTimer = setTimeout(() => (nodding.value = false), 400);
}

function bow(ms: number, then?: () => void): void {
  clearTimeout(bowTimer);
  bowing.value = true;
  bowTimer = setTimeout(() => {
    bowing.value = false;
    then?.();
  }, ms);
}

function scrollToLevel(level: number | null): void {
  if (level === null) return;
  const card = document.getElementById(`c${level}`);
  // The invitation to install sits just before the next level, after the first one done: show it too.
  const before = card?.previousElementSibling;
  const target = before?.classList.contains('invite') ? before : card;
  target?.scrollIntoView({ block: 'start', behavior: still() ? 'auto' : 'smooth' });
}

function dispatch(event: RoundEvent): void {
  const r = round.value;
  if (!r) return;
  const { round: next, completed } = advance(r, event);
  round.value = next;
  // Finding the notes needs the keys: on a phone, bring the instrument back if it is tucked away.
  if (next.phase === 'find' && r.phase !== 'find') dockOpen.value = true;
  if (event.type === 'sung' && next.phase === 'turn') nod();
  if (completed) complete(next);
}

/** Your turn starts with Merel listening: ask first if he never asked, otherwise open the microphone. */
function beginListening(): void {
  if (micChoice.value === null) asking.value = true;
  else void listenNow();
}

async function listenNow(): Promise<void> {
  const r = round.value;
  if (!r) return;
  const ok = await listen(
    r.melody,
    () => dispatch({ type: 'sung' }),
    () => dispatch({ type: 'wrong' }),
    () => dispatch({ type: 'missed' }),
    () => singing.value,
  );
  if (ok || round.value?.phase !== 'turn' || round.value.level !== r.level || round.value.melody !== r.melody) return;
  // Refused, missing or failing: you sing on your own, said once.
  setMicChoice('no');
  listenNote.value = 'off';
  dispatch({ type: 'deaf' });
}

/** The answer to Merel's ask: "Let him listen" or "Not now". */
export function answerAsk(yes: boolean): void {
  asking.value = false;
  setMicChoice(yes ? 'yes' : 'no');
  if (yes) void listenNow();
  else {
    listenNote.value = 'off';
    dispatch({ type: 'deaf' });
  }
}

/** "Let Merel listen" on a card, after a no: the browser asks again; he listens the next time you sing. */
export async function askAgain(): Promise<void> {
  unlock();
  const result = await askMic();
  if (result === 'ok') setMicChoice('yes');
  listenNote.value = result === 'ok' ? 'later' : result === 'refused' ? 'blocked' : 'failed';
}

// The microphone is open only while Sing is on and Merel listens.
effect(() => {
  const r = round.value;
  if (r && r.phase === 'turn' && r.listen) return;
  asking.value = false;
  stopListening();
});

function complete(r: Round): void {
  const { progress: next, levelDone } = completeRound(progress.value, r.level);
  setProgress(next);
  // A melody sung: the next one is new (exercise 3); the scales stay.
  if (!isRecognition(r.level)) lastMelody[r.level] = melodyFor(r.level, r.melody);
  bow(levelDone ? 1800 : 1400, () => {
    // Sing turns off; recognition stays on its answers until you listen again.
    if (round.value?.level === r.level && !isRecognition(r.level)) round.value = null;
    if (levelDone) scrollToLevel(activeLevel(progress.value));
  });
}

/** Brings the instrument up: a card's Listen or Sing, not only the first screen's Start (on a phone, someone may have scrolled down or come back to their level). */
function bringUp(): void {
  unlock();
  preloadVoice(lang.value);
  clearTimeout(bowTimer);
  bowing.value = false;
  started.value = true;
  dockOpen.value = true;
}

/** The melody a card sings now: the scale, or its random melody until you sing it. */
const melodyOf = (level: number) => (level <= 2 ? melodyFor(level) : (lastMelody[level] ??= melodyFor(level, null)));

/** Recognition: a new melody, Merel sings it, then the questions. */
function startRecognition(level: number): void {
  const melody = melodyFor(level, lastMelody[level] ?? null);
  lastMelody[level] = melody;
  const r = newRound(level, melody, 'hear');
  round.value = r;
  void perform(r).then((ended) => {
    if (ended) dispatch({ type: 'played' });
  });
}

/**
 * Listen: Merel sings the card's melody, which counts for nothing. While Sing is on, you sing from
 * do after it. In recognition it starts a round, or sings it again during one. Pressed while he
 * sings this card's melody, he stops.
 */
export function hear(level: number): void {
  bringUp();
  const r = round.value;
  const mine = r && r.level === level;
  if (mine && singing.value && (r.phase === 'preview' || r.phase === 'hear')) return stop();
  if (isRecognition(level)) {
    if (mine && (r.phase === 'direction' || r.phase === 'find')) void perform(r);
    else startRecognition(level);
    return;
  }
  if (mine && r.phase === 'turn') {
    if (r.listen) dispatch({ type: 'again' });
    void perform(r);
    return;
  }
  const preview = newRound(level, melodyOf(level), 'preview');
  round.value = preview;
  void perform(preview).then((ended) => {
    if (ended && round.value === preview) round.value = null;
  });
}

/** Whether Sing is on for a card. */
export const isSinging = (level: number) => {
  const r = round.value;
  return !!r && r.level === level && r.phase === 'turn';
};

/**
 * Sing, a switch. On: your turn; Merel listens when he can (asking first, once). Off: you stop;
 * when he was not listening, the round counts, as you sang it on your own.
 */
export function toggleSing(level: number): void {
  const r = round.value;
  if (r && r.level === level && r.phase === 'turn') {
    if (r.listen) stop();
    else dispatch({ type: 'finished' });
    return;
  }
  bringUp();
  silence();
  listenNote.value = null;
  const next = newRound(level, melodyOf(level), 'turn', canListen() && micChoice.value !== 'no');
  round.value = next;
  if (next.listen) beginListening();
}

export function stop(): void {
  silence();
  clearTimeout(bowTimer);
  bowing.value = false;
  round.value = null;
}

export function answer(up: boolean): void {
  dispatch({ type: 'answer', up });
}

/** Every key press reaches here; in a recognition round it is an answer. */
export function keyPressed(step: number): void {
  if (round.value?.phase === 'find') dispatch({ type: 'key', step });
  else muteKey(step);
}

export function skip(level: number): void {
  if (round.value?.level === level) stop();
  setProgress(skipLevel(progress.value, level));
  scrollToLevel(activeLevel(progress.value));
}
