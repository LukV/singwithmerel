/**
 * The page's audio session, where the browser has one (Safari and every iPhone browser, iOS 17
 * and later). By default an iPhone in silent mode mutes web audio; "playback" says the page plays
 * media, as a video does, so Merel and the keys sound anyway. While the microphone is open the
 * session goes back to "auto", which the browser makes play-and-record; closing it returns to
 * "playback". Elsewhere this does nothing.
 */

type SessionType = 'auto' | 'playback' | 'play-and-record';

function session(): { type: SessionType } | undefined {
  return (globalThis.navigator as { audioSession?: { type: SessionType } } | undefined)?.audioSession;
}

function set(type: SessionType): void {
  const s = session();
  if (!s || s.type === type) return;
  try {
    s.type = type;
  } catch {
    // not allowed now: the browser's default stays
  }
}

/** Sound plays in silent mode too. */
export const playbackSession = () => set('playback');

/** Let the browser pick the session for the open microphone. */
export const recordingSession = () => set('auto');
