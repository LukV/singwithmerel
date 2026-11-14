/**
 * `npm run voice`: checks Merel's clips and makes them ready for the app
 * (docs/reference/0010-voice-clips.md).
 *
 * Reads voice/*.wav and voice/manifest.json (outside public/, so the sources are never published), measures each clip's pitch, refuses any more
 * than 10 cents off its note, converts the others to AAC in public/voice/<name>.m4a, and writes
 * public/voice/voice.json, the list the app loads. Needs macOS (afconvert) or ffmpeg.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLIPS, LATEST_ONSET, TOLERANCE, type Verdict } from './voice/clips.ts';
import { cents, measure } from './voice/pitch.ts';
import { readWav } from './voice/wav.ts';

const VOICE = 'public/voice';
const SOURCE = 'voice';

function writeList(octaveOffset: number, clips: string[]) {
  mkdirSync(VOICE, { recursive: true });
  writeFileSync(join(VOICE, 'voice.json'), `${JSON.stringify({ octaveOffset, clips }, null, 2)}\n`);
}

function converter(): (from: string, to: string) => void {
  const has = (cmd: string) => {
    try {
      execFileSync('which', [cmd], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };
  if (has('afconvert')) return (from, to) => execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '96000', '-c', '1', from, to]);
  if (has('ffmpeg')) return (from, to) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', from, '-ac', '1', '-c:a', 'aac', '-b:a', '96k', to]);
  throw new Error('Converting needs afconvert (macOS) or ffmpeg.');
}

const wavs = existsSync(SOURCE) ? readdirSync(SOURCE).filter((f) => f.toLowerCase().endsWith('.wav')) : [];
if (!wavs.length) {
  console.log(`No clips in ${SOURCE}/: Merel sings with a plain tone. Drop the WAV files there and run npm run voice again.`);
  if (!existsSync(join(VOICE, 'voice.json'))) writeList(0, []);
  process.exit(0);
}

const manifestPath = join(SOURCE, 'manifest.json');
const manifest = existsSync(manifestPath) ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as { octaveOffset?: number }) : {};
const octaveOffset = manifest.octaveOffset ?? 0;
if (![0, -1, 1].includes(octaveOffset)) throw new Error(`octaveOffset in manifest.json must be -1, 0 or 1, not ${octaveOffset}`);

const verdicts: Verdict[] = [];
for (const file of wavs.sort()) {
  const name = file.replace(/\.wav$/i, '');
  const clip = CLIPS.find((c) => c.name === name);
  if (!clip) {
    verdicts.push({ name, hz: null, cents: null, onset: 0, ok: false, problem: 'not one of the 17 names' });
    continue;
  }
  const target = clip.hz * 2 ** octaveOffset;
  try {
    const sound = readWav(readFileSync(join(SOURCE, file)));
    const m = measure(sound, target);
    const off = m.hz === null ? null : cents(m.hz, target);
    const problem =
      off === null ? 'no steady pitch found' : Math.abs(off) > TOLERANCE ? `${off > 0 ? 'sharp' : 'flat'} by ${Math.abs(off).toFixed(1)} cents` : undefined;
    verdicts.push({ name, hz: m.hz, cents: off, onset: m.onset, ok: !problem, ...(problem ? { problem } : {}) });
  } catch (error) {
    verdicts.push({ name, hz: null, cents: null, onset: 0, ok: false, problem: (error as Error).message });
  }
}

console.log(`Target A4 = 440 Hz${octaveOffset ? `, sung ${octaveOffset < 0 ? 'one octave down' : 'one octave up'}` : ''}; at most ${TOLERANCE} cents off.\n`);
for (const v of verdicts) {
  const offset = v.cents === null ? '      ' : `${v.cents >= 0 ? '+' : ''}${v.cents.toFixed(1).padStart(5)}`;
  const late = v.onset > LATEST_ONSET ? `  (starts at ${Math.round(v.onset * 1000)} ms: trim the silence)` : '';
  console.log(`${v.ok ? 'ok     ' : 'REFUSED'}  ${v.name.padEnd(7)} ${offset} cents${v.problem ? `  ${v.problem}` : ''}${late}`);
}
const missing = CLIPS.filter((c) => !verdicts.some((v) => v.name === c.name)).map((c) => c.name);
if (missing.length) console.log(`\nMissing, sung with the tone: ${missing.join(', ')}`);

const good = verdicts.filter((v) => v.ok);
const convert = converter();
for (const old of readdirSync(VOICE).filter((f) => f.endsWith('.m4a'))) rmSync(join(VOICE, old));
for (const v of good) convert(join(SOURCE, `${v.name}.wav`), join(VOICE, `${v.name}.m4a`));
writeList(octaveOffset, good.map((v) => v.name));

const refused = verdicts.length - good.length;
console.log(`\n${good.length} clip${good.length === 1 ? '' : 's'} ready in ${VOICE}/${refused ? `; ${refused} refused, fix them and run again` : '.'}`);
process.exit(refused ? 1 : 0);
