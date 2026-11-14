import { answerInstall, install, installAnswered, installPrompt, isInstalled, isIos } from '../install';
import { isDone } from '../progress/levels';
import { LEVELS } from '../progress/store';
import { progress, t } from '../state';

/**
 * After the first completed level, once: an invitation to add Merel to the home screen, with why
 * (docs/product/0020-features.md). Shown only where it can be done: Safari on an iPhone or iPad,
 * or a browser that offered to install.
 */
export function InstallInvite() {
  const s = t.value;
  const p = progress.value;
  if (installAnswered.value || isInstalled() || !LEVELS.some((level) => isDone(p, level))) return null;
  const ios = isIos();
  if (!ios && !installPrompt.value) return null;
  return (
    <aside class="invite" aria-labelledby="invite-title">
      <h2 id="invite-title" class="invite__title lettering">
        {s.install.title}
      </h2>
      <p class="invite__text">{ios ? s.install.iosText : s.install.text}</p>
      {ios && <p class="invite__text invite__how">{s.install.iosHow}</p>}
      <div class="invite__buttons">
        {!ios && (
          <button type="button" class="button button--filled" onClick={() => void install()}>
            {s.install.button}
          </button>
        )}
        <button type="button" class="button" onClick={() => answerInstall('later')}>
          {s.install.later}
        </button>
      </div>
    </aside>
  );
}
