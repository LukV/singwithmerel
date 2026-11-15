/**
 * The AudioWorklet that listens: it runs on the audio thread, feeds the microphone's samples to
 * the tracker, and posts each frame's pitch and level to the page. Samples are analysed in memory
 * and dropped; nothing is kept or sent. Loaded by mic.ts from our own origin.
 */
import { Tracker } from './tracker';

// The worklet's own globals, which the DOM types do not describe.
declare const sampleRate: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}
declare function registerProcessor(name: string, processor: new () => AudioWorkletProcessor): void;

class PitchProcessor extends AudioWorkletProcessor {
  private readonly tracker = new Tracker(sampleRate);

  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0];
    if (channel) for (const frame of this.tracker.push(channel)) this.port.postMessage(frame);
    return true;
  }
}

registerProcessor('merel-pitch', PitchProcessor);
