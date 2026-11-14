/** A WAV file read into mono samples from -1 to 1: PCM 16, 24 or 32 bit, or 32-bit float. */
export interface Sound {
  rate: number;
  samples: Float32Array;
}

export function readWav(bytes: Uint8Array): Sound {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4));
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not a WAV file');
  let format = 0;
  let channels = 0;
  let rate = 0;
  let bits = 0;
  let data: { at: number; size: number } | null = null;
  for (let at = 12; at + 8 <= bytes.length; ) {
    const id = tag(at);
    const size = view.getUint32(at + 4, true);
    if (id === 'fmt ') {
      format = view.getUint16(at + 8, true);
      channels = view.getUint16(at + 10, true);
      rate = view.getUint32(at + 12, true);
      bits = view.getUint16(at + 22, true);
      if (format === 0xfffe) format = view.getUint16(at + 32, true); // WAVE_FORMAT_EXTENSIBLE: the real format
    } else if (id === 'data') {
      data = { at: at + 8, size: Math.min(size, bytes.length - at - 8) };
    }
    at += 8 + size + (size % 2);
  }
  if (!data || !channels || !rate) throw new Error('no audio data in the WAV file');
  const float = format === 3;
  if (!(format === 1 && [16, 24, 32].includes(bits)) && !(float && bits === 32)) {
    throw new Error(`unsupported WAV format (format ${format}, ${bits} bit)`);
  }
  const width = bits / 8;
  const frames = Math.floor(data.size / (width * channels));
  const samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) {
      const at = data.at + (i * channels + c) * width;
      if (float) sum += view.getFloat32(at, true);
      else if (bits === 16) sum += view.getInt16(at, true) / 0x8000;
      else if (bits === 24) sum += (((view.getUint8(at + 2) << 24) | (view.getUint8(at + 1) << 16) | (view.getUint8(at) << 8)) >> 8) / 0x800000;
      else sum += view.getInt32(at, true) / 0x80000000;
    }
    samples[i] = sum / channels;
  }
  return { rate, samples };
}

/** A mono 16-bit PCM WAV file, for the tests. */
export function writeWav({ rate, samples }: Sound): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const text = (at: number, s: string) => [...s].forEach((ch, i) => view.setUint8(at + i, ch.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
  return bytes;
}
