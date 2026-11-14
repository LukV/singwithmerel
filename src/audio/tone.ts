/**
 * One AudioContext for the whole app, and a plain tone for the instrument and as Merel's
 * stand-in when a clip is missing. Browsers, iOS Safari first, only allow sound after a tap:
 * `unlock()` is called from Start and from every key press, inside a user gesture.
 */

let context: AudioContext | null = null;

export function audioContext(): AudioContext | null {
  if (context) return context;
  const AC: typeof AudioContext | undefined =
    globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  context = new AC();
  return context;
}

export function unlock(): void {
  const ac = audioContext();
  if (ac && ac.state !== 'running') void ac.resume().catch(() => undefined);
}

/** A soft triangle tone from `start` (audio clock) for `seconds`; returns the source to stop it. */
export function scheduleTone(freq: number, start: number, seconds: number): AudioScheduledSourceNode | null {
  const ac = audioContext();
  if (!ac) return null;
  const t = Math.max(start, ac.currentTime);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
  gain.gain.setValueAtTime(0.25, t + Math.max(0.05, seconds - 0.12));
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.15);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.2);
  return osc;
}

/** A tone now, for a key press. */
export function playTone(freq: number, seconds = 0.6): void {
  const ac = audioContext();
  if (!ac) return;
  unlock();
  scheduleTone(freq, ac.currentTime, seconds);
}
