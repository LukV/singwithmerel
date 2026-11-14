/**
 * `npm run piano`: makes the instrument's piano sound (docs/architecture/decisions/013-piano-samples.md).
 *
 * Downloads the eight notes of the scale, C4 to C5, from the University of Iowa's piano recordings
 * (mezzo forte), trims the silence before each, keeps two seconds with a soft fade, levels them,
 * checks their pitch, and writes public/piano/<pitch>.m4a. The sources are large and stay in a
 * temporary folder; only the short clips are kept. Needs a network, and afconvert (macOS) or ffmpeg.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { converter, toWav } from './voice/convert.ts';
import { cents, measure } from './voice/pitch.ts';
import { readWav, writeWav, type Sound } from './voice/wav.ts';

const SOURCE = 'https://theremin.music.uiowa.edu/sound%20files/MIS/Piano_Other/piano';
const OUT = 'public/piano';
const NOTES: [pitch: string, hz: number][] = [
  ['C4', 261.63],
  ['D4', 293.66],
  ['E4', 329.63],
  ['F4', 349.23],
  ['G4', 392.0],
  ['A4', 440.0],
  ['B4', 493.88],
  ['C5', 523.25],
];
const LENGTH = 2.0; // seconds kept from the strike
const FADE = 0.5; // seconds of fade at the end
const PRE = 0.003; // seconds kept before the strike
const PEAK = 0.7; // every note is levelled to this peak

/** From just before the strike, LENGTH seconds, levelled, with a short fade in and a long fade out. */
export function shape({ rate, samples }: Sound): Sound {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  const strike = samples.findIndex((v) => Math.abs(v) > peak * 0.05);
  const from = Math.max(0, strike - Math.round(PRE * rate));
  const out = samples.slice(from, from + Math.round(LENGTH * rate));
  const gain = peak > 0 ? PEAK / peak : 1;
  const fadeIn = Math.round(PRE * rate);
  const fadeOut = Math.round(FADE * rate);
  for (let i = 0; i < out.length; i++) {
    let g = gain;
    if (i < fadeIn) g *= i / fadeIn;
    const left = out.length - i;
    if (left < fadeOut) g *= (left / fadeOut) ** 2;
    out[i] = out[i]! * g;
  }
  return { rate, samples: out };
}

async function main() {
  const work = mkdtempSync(join(tmpdir(), 'merel-piano-'));
  const convert = converter();
  mkdirSync(OUT, { recursive: true });
  try {
    for (const [pitch, hz] of NOTES) {
      const res = await fetch(`${SOURCE}/Piano.mf.${pitch}.aiff`);
      if (!res.ok) throw new Error(`${pitch}: the download answered ${res.status}`);
      const aiff = join(work, `${pitch}.aiff`);
      writeFileSync(aiff, new Uint8Array(await res.arrayBuffer()));
      toWav(aiff, join(work, `${pitch}.wav`));
      const sound = shape(readWav(readFileSync(join(work, `${pitch}.wav`))));
      const heard = measure(sound, hz).hz;
      if (heard === null) throw new Error(`${pitch}: no pitch found in the recording`);
      const off = cents(heard, hz);
      console.log(`${pitch.padEnd(3)} ${off >= 0 ? '+' : ''}${off.toFixed(1).padStart(5)} cents`);
      writeFileSync(join(work, `${pitch}-short.wav`), writeWav(sound));
      convert(join(work, `${pitch}-short.wav`), join(OUT, `${pitch}.m4a`));
    }
    console.log(`\n${NOTES.length} piano notes in ${OUT}/.`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (import.meta.main) await main();
