import { batch, signal } from '@preact/signals';
import { audioContext, unlock } from '../audio/tone';
import { BEAT, preloadVoice, sing, type Performance } from '../audio/voice';
import type { Melody } from '../melody/melody';
import { activeLevel, completeRound, skipLevel } from '../progress/levels';
import { dockOpen, lang, progress, setProgress } from '../state';
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
/** Whether Merel is singing now. */
export const singing = signal(false);

const lastMelody: Record<number, Melody | null> = {};
let performance: Performance | null = null;
let token = 0;
let bowTimer: ReturnType<typeof setTimeout> | undefined;

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
  document.getElementById(`c${level}`)?.scrollIntoView({ block: 'start', behavior: still() ? 'auto' : 'smooth' });
}

function dispatch(event: RoundEvent): void {
  const r = round.value;
  if (!r) return;
  const { round: next, completed } = advance(r, event);
  round.value = next;
  if (completed) complete(next);
  else if (next.phase === 'along' && r.phase === 'hear') void playAlong(next);
}

function complete(r: Round): void {
  const { progress: next, levelDone } = completeRound(progress.value, r.level);
  setProgress(next);
  if (levelDone) {
    // The level is complete: Merel bows, then the next level opens and the feed moves to it.
    round.value = { ...r, phase: 'done' };
    bow(1800, () => {
      if (round.value?.level === r.level) round.value = null;
      scrollToLevel(activeLevel(progress.value));
    });
  } else {
    bow(1400);
  }
}

async function playHear(r: Round): Promise<void> {
  if (await perform(r)) dispatch({ type: 'played' });
}

async function playAlong(r: Round): Promise<void> {
  // A beat of rest, then Merel sings it again with you.
  if (await perform(r, BEAT)) dispatch({ type: 'played' });
}

export function startRound(level: number): void {
  unlock();
  preloadVoice(lang.value);
  clearTimeout(bowTimer);
  bowing.value = false;
  dockOpen.value = true;
  const melody = melodyFor(level, lastMelody[level] ?? null);
  lastMelody[level] = melody;
  const r = newRound(level, melody);
  round.value = r;
  void playHear(r);
}

/** "Hear it": during recognition, sing the melody again; otherwise sing an example, which counts for nothing. */
export function hear(level: number): void {
  unlock();
  const r = round.value;
  if (r && r.level === level && (r.phase === 'direction' || r.phase === 'find' || r.phase === 'turn' || r.phase === 'done')) {
    void perform(r);
    return;
  }
  clearTimeout(bowTimer);
  bowing.value = false;
  dockOpen.value = true;
  const melody = level <= 2 ? melodyFor(level) : (lastMelody[level] ??= melodyFor(level));
  const preview = newRound(level, melody, 'preview');
  round.value = preview;
  void perform(preview).then((ended) => {
    if (ended && round.value === preview) round.value = null;
  });
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
}

export function skip(level: number): void {
  if (round.value?.level === level) stop();
  setProgress(skipLevel(progress.value, level));
  scrollToLevel(activeLevel(progress.value));
}
