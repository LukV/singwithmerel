/**
 * One AudioContext for the whole app, and a plain tone for the instrument.
 * Browsers, iOS Safari first, only allow sound after a tap: `unlock()` is called from Start
 * and from every key press, so the context is created and resumed inside a user gesture.
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

/** A soft triangle tone, `seconds` long, starting `at` seconds from now on the audio clock. */
export function playTone(freq: number, seconds = 0.6, at = 0): void {
  const ac = audioContext();
  if (!ac) return;
  unlock();
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.2);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.25);
}
