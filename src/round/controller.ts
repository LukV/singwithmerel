import { batch, effect, signal } from '@preact/signals';
import { audioContext, unlock } from '../audio/tone';
import { BEAT, preloadVoice, sing, type Performance } from '../audio/voice';
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
  else if (next.phase === 'along' && r.phase === 'hear') void playAlong(next);
  if (next.phase === 'turn' && r.phase === 'along' && next.listen) beginListening();
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
    () => dispatch({ type: 'missed' }),
    () => singing.value,
  );
  if (ok || round.value?.phase !== 'turn' || round.value.level !== r.level || round.value.melody !== r.melody) return;
  // Refused, missing or failing: the release 1 rule, said once.
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

/** "Let Merel listen" on a card, after a no: the browser asks again; he listens from the next round. */
export async function askAgain(): Promise<void> {
  unlock();
  const result = await askMic();
  if (result === 'ok') setMicChoice('yes');
  listenNote.value = result === 'ok' ? 'later' : result === 'refused' ? 'blocked' : 'failed';
}

// The microphone is open only during a Your turn that listens.
effect(() => {
  const r = round.value;
  if (r && r.phase === 'turn' && r.listen) return;
  asking.value = false;
  stopListening();
});

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
  // A card's Start or Hear it brings the instrument up too, not only the first screen's Start:
  // on a phone, someone who scrolled down or came back to their level would otherwise not see it.
  started.value = true;
  dockOpen.value = true;
  listenNote.value = null;
  const melody = melodyFor(level, lastMelody[level] ?? null);
  lastMelody[level] = melody;
  const r = newRound(level, melody, 'hear', canListen() && micChoice.value !== 'no');
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
  // A card's Start or Hear it brings the instrument up too, not only the first screen's Start:
  // on a phone, someone who scrolled down or came back to their level would otherwise not see it.
  started.value = true;
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
  else muteKey(step);
}

export function skip(level: number): void {
  if (round.value?.level === level) stop();
  setProgress(skipLevel(progress.value, level));
  scrollToLevel(activeLevel(progress.value));
}
