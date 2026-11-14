import { execFileSync } from 'node:child_process';

/** Whether a command is on the path. */
export function has(cmd: string): boolean {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Converts a WAV file to mono AAC in .m4a, with afconvert on a Mac or ffmpeg elsewhere. */
export function converter(): (from: string, to: string) => void {
  if (has('afconvert')) return (from, to) => execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '96000', '-c', '1', from, to]);
  if (has('ffmpeg')) return (from, to) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', from, '-ac', '1', '-c:a', 'aac', '-b:a', '96k', to]);
  throw new Error('Converting needs afconvert (macOS) or ffmpeg.');
}

/** Converts any audio file afconvert or ffmpeg can read (AIFF, for one) to a 16-bit mono WAV file. */
export function toWav(from: string, to: string): void {
  if (has('afconvert')) execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16', '-c', '1', from, to]);
  else if (has('ffmpeg')) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', from, '-ac', '1', '-c:a', 'pcm_s16le', to]);
  else throw new Error('Converting needs afconvert (macOS) or ffmpeg.');
}
