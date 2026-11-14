import { LANGS, pathFor, type Lang } from '../i18n/langs';
import { STRINGS } from '../i18n/strings';
import { applyLang, lang, t } from '../state';

export function Header() {
  const s = t.value;
  const choose = (e: MouseEvent, next: Lang) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    applyLang(next);
  };
  return (
    <header class="header">
      <nav aria-label={s.navLabel} class="header__nav">
        <a href="#c1">{s.navSing}</a>
        <a href="#c4">{s.navRecognise}</a>
        <a href="#progress">{s.navProgress}</a>
      </nav>
      <nav aria-label={s.languageLabel} class="header__langs">
        {LANGS.map((l) => (
          <a
            key={l}
            href={pathFor(l)}
            hrefLang={l}
            lang={l}
            aria-current={l === lang.value ? 'true' : undefined}
            title={STRINGS[l].langName}
            onClick={(e) => choose(e, l)}
          >
            {l.toUpperCase()}
          </a>
        ))}
      </nav>
    </header>
  );
}
