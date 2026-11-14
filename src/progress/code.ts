import { normalise, type Progress } from './store';

/**
 * The progress code: the record without the language and the date, compressed with deflate and
 * written in base64url, so it can be copied into a message and pasted back on another browser.
 * `m1.` marks a compressed code; `m0.` an uncompressed one, from a browser without compression.
 */

const toBase64url = (bytes: Uint8Array) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64url = (text: string) => {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function through(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const reader = source.pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

export async function encodeProgress(p: Progress): Promise<string> {
  const json = JSON.stringify({ version: 1, levels: p.levels, skipped: p.skipped });
  const bytes = new TextEncoder().encode(json);
  if (!canCompress()) return `m0.${toBase64url(bytes)}`;
  return `m1.${toBase64url(await through(bytes, new CompressionStream('deflate-raw')))}`;
}

/** The record a code holds, or null if the code is damaged. Spaces and line breaks are ignored. */
export async function decodeProgress(code: string): Promise<Progress | null> {
  const clean = code.replace(/\s+/g, '');
  const match = /^m([01])\.([A-Za-z0-9_-]+)$/.exec(clean);
  if (!match) return null;
  try {
    let bytes: Uint8Array = fromBase64url(match[2]!);
    if (match[1] === '1') {
      if (!canCompress()) return null;
      bytes = await through(bytes, new DecompressionStream('deflate-raw'));
    }
    return normalise(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}
