import { useEffect, useState } from 'preact/hooks';
import { decodeProgress, encodeProgress } from '../progress/code';
import { stop } from '../round/controller';
import { progress, setProgress, t } from '../state';

/** The progress code, to copy and to paste back in another browser. */
export function ProgressPanel() {
  const s = t.value;
  const [code, setCode] = useState('');
  const [pasted, setPasted] = useState('');
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const current = progress.value;

  useEffect(() => {
    let live = true;
    void encodeProgress(current).then((c) => live && setCode(c));
    return () => {
      live = false;
    };
  }, [current.levels, current.skipped]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setNote({ text: s.copied, ok: true });
    } catch {
      setNote({ text: s.copyFailed, ok: false });
    }
  };

  const restore = async (e: Event) => {
    e.preventDefault();
    const restored = await decodeProgress(pasted);
    if (!restored) {
      setNote({ text: s.badCode, ok: false });
      return;
    }
    stop();
    setProgress({ ...restored, lang: current.lang });
    setPasted('');
    setNote({ text: s.restored, ok: true });
  };

  return (
    <section id="progress" class="progress" aria-labelledby="progress-title">
      <h2 id="progress-title" class="progress__title lettering">
        {s.progressTitle}
      </h2>
      <p class="progress__text">{s.progressText}</p>
      <label class="progress__label" for="progress-code">
        {s.progressCode}
      </label>
      <div class="progress__row">
        <input id="progress-code" class="progress__input" readOnly value={code} onFocus={(e) => e.currentTarget.select()} spellcheck={false} />
        <button type="button" class="button" onClick={copy} disabled={!code}>
          {s.copy}
        </button>
      </div>
      <form class="progress__row" onSubmit={restore}>
        <label class="visually-hidden" for="progress-paste">
          {s.pasteLabel}
        </label>
        <input
          id="progress-paste"
          class="progress__input"
          placeholder={s.pasteLabel}
          value={pasted}
          onInput={(e) => setPasted(e.currentTarget.value)}
          autocomplete="off"
          spellcheck={false}
        />
        <button type="submit" class="button" disabled={!pasted.trim()}>
          {s.restore}
        </button>
      </form>
      <p class={`progress__note${note && !note.ok ? ' is-wrong' : ''}`} role="status">
        {note?.text ?? ''}
      </p>
    </section>
  );
}
