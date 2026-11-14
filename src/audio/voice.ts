import type { Lang } from '../i18n/langs';
import type { Melody } from '../melody/melody';
import { SCALE } from '../melody/scale';
import { audioContext, scheduleTone } from './tone';

/**
 * Merel's voice: the clips in public/voice/ (docs/reference/0010-voice-clips.md), sung on the
 * note's name or on "du". `npm run voice` lists the clips that exist in public/voice/voice.json;
 * a clip that is not listed, or does not decode, falls back to a plain tone at that pitch, in the
 * clips' octave, so Merel sings before any clip exists. Everything is scheduled on the audio
 * clock, a beat at 90 per minute.
 */

export type VoiceSet = 'named' | 'du';

export const BPM = 90;
export const BEAT = 60 / BPM;

const SYLLABLES = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do'];

/** The clip's file name without extension, as in `sol-G4`, `ti-B4` or `du-C5`. */
export function clipName(step: number, set: VoiceSet, lang: Lang): string {
  const note = SCALE[step]!;
  if (set === 'du') return `du-${note.pitch}`;
  const syllable = step === 6 && lang === 'en' ? 'ti' : SYLLABLES[step]!;
  return `${syllable}-${note.pitch}`;
}

export interface VoiceList {
  /** -1 when the clips are sung an octave below the written pitch. */
  octaveOffset: number;
  clips: string[];
}

let list: Promise<VoiceList> | null = null;

/** The clips that exist, read once from public/voice/voice.json; none if it cannot be read. */
export function voiceList(): Promise<VoiceList> {
  list ??= (async () => {
    const none = { octaveOffset: 0, clips: [] };
    if (typeof fetch !== 'function') return none;
    try {
      const res = await fetch('/voice/voice.json');
      if (!res.ok) return none;
      const data = (await res.json()) as Partial<VoiceList>;
      return {
        octaveOffset: [-1, 0, 1].includes(data.octaveOffset ?? 0) ? (data.octaveOffset ?? 0) : 0,
        clips: Array.isArray(data.clips) ? data.clips.filter((c): c is string => typeof c === 'string') : [],
      };
    } catch {
      return none;
    }
  })();
  return list;
}

const clips = new Map<string, Promise<AudioBuffer | null>>();

export function loadClip(name: string): Promise<AudioBuffer | null> {
  let clip = clips.get(name);
  if (!clip) {
    clip = (async () => {
      const ac = audioContext();
      if (!ac || typeof fetch !== 'function') return null;
      if (!(await voiceList()).clips.includes(name)) return null;
      try {
        const res = await fetch(`/voice/${name}.m4a`);
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || type.startsWith('text/')) return null;
        return await ac.decodeAudioData(await res.arrayBuffer());
      } catch {
        return null; // missing or not audio: the tone stands in
      }
    })();
    clips.set(name, clip);
  }
  return clip;
}

/** Load every clip a set needs, in the background, so the first round starts on time. */
export function preloadVoice(lang: Lang): void {
  for (let step = 0; step < SCALE.length; step++) {
    void loadClip(clipName(step, 'named', lang));
    void loadClip(clipName(step, 'du', lang));
  }
}

export interface Performance {
  /** When each note starts, on the audio clock. */
  starts: number[];
  /** When the last note ends. */
  end: number;
  /** Which note sounds now, or null before the first and after the last. */
  noteAt(time: number): number | null;
  stop(): void;
}

/** Merel sings a melody, starting `delay` seconds from now. */
export async function sing(melody: Melody, set: VoiceSet, lang: Lang, delay = 0.12): Promise<Performance | null> {
  const ac = audioContext();
  if (!ac) return null;
  const [{ octaveOffset }, ...buffers] = await Promise.all([voiceList(), ...melody.map((n) => loadClip(clipName(n.step, set, lang)))] as const);
  const t0 = ac.currentTime + delay;
  const sources: AudioScheduledSourceNode[] = [];
  const starts: number[] = [];
  let beat = 0;
  melody.forEach((note, i) => {
    const start = t0 + beat * BEAT;
    const length = note.beats * BEAT;
    starts.push(start);
    beat += note.beats;
    const buffer = buffers[i];
    if (buffer) {
      const src = ac.createBufferSource();
      const gain = ac.createGain();
      src.buffer = buffer;
      // Hold for the note's length, then fade, so a long clip does not run into the next note.
      gain.gain.setValueAtTime(1, start);
      gain.gain.setValueAtTime(1, start + Math.max(0.05, length - 0.08));
      gain.gain.linearRampToValueAtTime(0, start + length + 0.04);
      src.connect(gain);
      gain.connect(ac.destination);
      src.start(start);
      src.stop(start + length + 0.06);
      sources.push(src);
    } else {
      const src = scheduleTone(SCALE[note.step]!.freq * 2 ** octaveOffset, start, length * 0.92);
      if (src) sources.push(src);
    }
  });
  const end = t0 + beat * BEAT;
  return {
    starts,
    end,
    noteAt(time) {
      if (time < t0 || time >= end) return null;
      let index: number | null = null;
      starts.forEach((s, i) => {
        if (time >= s) index = i;
      });
      return index;
    },
    stop() {
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          // already stopped
        }
      }
    },
  };
}
