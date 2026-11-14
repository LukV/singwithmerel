import { SCALE } from '../melody/scale';
import { audioContext, playTone, unlock } from './tone';

/**
 * The instrument's sound: a grand piano, one short recording per key in public/piano/
 * (made by `npm run piano`, docs/architecture/decisions/013-piano-samples.md). The notes load at the
 * first touch or key press; one that cannot be loaded or decoded plays the plain tone instead.
 */

const notes = new Map<string, Promise<AudioBuffer | null>>();
const ready = new Map<string, AudioBuffer>();

function load(pitch: string): Promise<AudioBuffer | null> {
  let note = notes.get(pitch);
  if (!note) {
    note = (async () => {
      const ac = audioContext();
      if (!ac || typeof fetch !== 'function') return null;
      try {
        const res = await fetch(`/piano/${pitch}.m4a`);
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || type.startsWith('text/')) return null;
        const buffer = await ac.decodeAudioData(await res.arrayBuffer());
        ready.set(pitch, buffer);
        return buffer;
      } catch {
        return null; // the tone stands in
      }
    })();
    notes.set(pitch, note);
  }
  return note;
}

/** Load the eight notes in the background, so the first key press already sounds like a piano. */
export function preloadPiano(): void {
  for (const note of SCALE) void load(note.pitch);
}

/**
 * Start loading at the first touch, click or key press anywhere: the AudioContext that decodes
 * the notes is only allowed once the page has been used.
 */
export function loadPianoOnFirstUse(): void {
  const first = () => {
    window.removeEventListener('pointerdown', first, true);
    window.removeEventListener('keydown', first, true);
    preloadPiano();
  };
  window.addEventListener('pointerdown', first, true);
  window.addEventListener('keydown', first, true);
}

/** A key press: the piano note now; the first time, as soon as it has loaded, or the plain tone if that takes too long. */
export function playPiano(step: number): void {
  const note = SCALE[step];
  const ac = audioContext();
  if (!note || !ac) return;
  unlock();
  const buffer = ready.get(note.pitch);
  if (buffer) {
    strike(ac, buffer);
    return;
  }
  const asked = performance.now();
  void load(note.pitch).then((loaded) => {
    if (loaded && performance.now() - asked < 250) strike(ac, loaded);
    else playTone(note.freq);
  });
}

function strike(ac: AudioContext, buffer: AudioBuffer): void {
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  src.buffer = buffer;
  gain.gain.value = 0.8;
  src.connect(gain);
  gain.connect(ac.destination);
  src.start();
}
