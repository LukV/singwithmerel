import { audioContext } from '../audio/tone';
import type { Frame } from './tracker';
import workletUrl from './pitch-worklet.ts?worker&url';

/**
 * The microphone, open only while Merel listens. Raw sound (no echo cancelling, noise suppression
 * or automatic gain, which bend a sung pitch) goes into the app's one AudioContext and through the
 * pitch worklet; the page gets frames of pitch and level, never the sound.
 */

/** Whether this browser can listen at all: a microphone API, a secure page, AudioWorklet. */
export function canListen(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof AudioWorkletNode !== 'undefined' &&
    globalThis.isSecureContext !== false
  );
}

export interface Mic {
  close(): void;
}

let loaded: Promise<void> | null = null;

/** Opens the microphone; resolves to null when it is refused, missing or fails. */
export async function openMic(onFrame: (frame: Frame) => void): Promise<Mic | null> {
  const ac = audioContext();
  if (!ac || !canListen() || !ac.audioWorklet) return null;
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    loaded ??= ac.audioWorklet.addModule(workletUrl).catch((error: unknown) => {
      loaded = null;
      throw error;
    });
    await loaded;
    if (ac.state !== 'running') await ac.resume().catch(() => undefined);
    const source = ac.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(ac, 'merel-pitch', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1, channelCountMode: 'explicit' });
    // The worklet only runs when connected to the output; it is silent, and a zero gain makes sure.
    const mute = ac.createGain();
    mute.gain.value = 0;
    source.connect(node).connect(mute).connect(ac.destination);
    node.port.onmessage = (e: MessageEvent<Frame>) => onFrame(e.data);
    const open = stream;
    return {
      close() {
        node.port.onmessage = null;
        source.disconnect();
        node.disconnect();
        mute.disconnect();
        for (const track of open.getTracks()) track.stop();
      },
    };
  } catch {
    for (const track of stream?.getTracks() ?? []) track.stop();
    return null;
  }
}
