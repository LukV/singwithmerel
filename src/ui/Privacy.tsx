import { pathFor } from '../i18n/langs';
import { lang, t } from '../state';
import { Header } from './Header';

/** Privacy and about, one page per language at /<lang>/privacy/. */
export function Privacy() {
  const s = t.value;
  const p = s.privacy;
  return (
    <main class="privacy">
      <Header />
      <article class="privacy__body">
        <h1 class="privacy__title lettering">{p.title}</h1>
        {p.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <h2 class="privacy__title lettering">{p.aboutTitle}</h2>
        {p.about.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <p>
          <a href="https://github.com/LukV/singwithmerel" rel="noopener">
            {p.code}
          </a>
        </p>
        <p class="privacy__back">
          <a class="button" href={pathFor(lang.value)}>
            {p.back}
          </a>
        </p>
      </article>
    </main>
  );
}
