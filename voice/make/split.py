#!/usr/bin/env python3
"""Cut one Synthesizer V render of merel-17.mid into Merel's 17 clips.

    python3 voice/make/split.py render.wav

Finds the 17 sung notes by the silence between them, keeps each from just before its sound
starts to just after it ends, mixes to mono, fades the edges, and writes them into voice/
under their names (do-C4.wav ... du-C5.wav). Then run `npm run voice` to check the pitch.
Standard library only. Reads 16, 24 or 32 bit integer PCM WAV.
"""
import array, math, os, sys, wave

NAMES = ["do-C4", "re-D4", "mi-E4", "fa-F4", "sol-G4", "la-A4", "si-B4", "do-C5", "ti-B4"] + [
    f"du-{p}" for p in ("C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5")]
PRE_ROLL = 0.010     # seconds kept before the sound starts (the app wants it within 0.02)
POST_ROLL = 0.060    # seconds kept after it ends
FADE = 0.008         # fade in and out, seconds
WINDOW = 0.010       # analysis window, seconds
THRESHOLD_DB = -40   # below the loudest window, counts as silence
MIN_GAP = 0.25       # a silence shorter than this is inside a note (a consonant), not between notes


def read(path):
    with wave.open(path, "rb") as w:
        ch, width, rate, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        raw = w.readframes(n)
    if width not in (2, 3, 4):
        sys.exit(f"{path}: {8 * width} bit is not supported; export 16 or 24 bit PCM.")
    full = float(1 << (8 * width - 1))
    vals = []
    for i in range(0, len(raw), width):
        b = raw[i:i + width]
        v = int.from_bytes(b, "little", signed=True)
        vals.append(v / full)
    mono = [sum(vals[i:i + ch]) / ch for i in range(0, len(vals), ch)]
    return mono, rate, width


def write(path, samples, rate, width):
    full = (1 << (8 * width - 1)) - 1
    out = bytearray()
    for s in samples:
        v = max(-full, min(full, int(round(s * full))))
        out += v.to_bytes(width, "little", signed=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(width); w.setframerate(rate); w.writeframes(bytes(out))


def regions(samples, rate):
    win = max(1, int(WINDOW * rate))
    rms = [math.sqrt(sum(x * x for x in samples[i:i + win]) / win) for i in range(0, len(samples), win)]
    peak = max(rms) or 1.0
    floor = peak * 10 ** (THRESHOLD_DB / 20)
    loud = [r > floor for r in rms]
    found, start = [], None
    for i, on in enumerate(loud + [False]):
        if on and start is None:
            start = i
        elif not on and start is not None:
            found.append([start, i]); start = None
    merged = []
    for r in found:
        if merged and (r[0] - merged[-1][1]) * WINDOW < MIN_GAP:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return [(a * win, b * win) for a, b in merged]


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    samples, rate, width = read(src)
    found = regions(samples, rate)
    if len(found) != len(NAMES):
        sys.exit(f"Found {len(found)} notes instead of {len(NAMES)}. Check the render: one voice, nothing else, "
                 f"a silence between notes. If a note is split, raise MIN_GAP; if two run together, lower THRESHOLD_DB.")
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    if rate != 48000:
        print(f"Note: the render is {rate} Hz; the spec asks for 48000. The clips keep {rate} Hz.")
    pre, post, fade = int(PRE_ROLL * rate), int(POST_ROLL * rate), int(FADE * rate)
    for name, (a, b) in zip(NAMES, found):
        clip = samples[max(0, a - pre):min(len(samples), b + post)]
        for i in range(min(fade, len(clip))):
            g = i / fade
            clip[i] *= g
            clip[-1 - i] *= g
        peak = max(abs(x) for x in clip) or 1.0
        gain = 10 ** (-3 / 20) / peak            # peak at -3 dBFS, the same loudness for every clip
        clip = [x * gain for x in clip]
        path = os.path.normpath(os.path.join(out_dir, f"{name}.wav"))
        write(path, clip, rate, width)
        print(f"{name}.wav  {len(clip) / rate:.2f} s")
    print(f"\n{len(NAMES)} clips written to {os.path.normpath(out_dir)}. Now run: npm run voice")


if __name__ == "__main__":
    main()
