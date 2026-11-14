import { useEffect } from 'preact/hooks';
import { langFromPath } from './i18n/langs';
import { applyLang, started } from './state';
import { DevControl } from './ui/DevControl';
import { Identity } from './ui/Identity';
import { Instrument } from './ui/Instrument';
import { Lesson } from './ui/Lesson';
import { onKeyDown } from './ui/play';
import { useMedia } from './ui/useMedia';

/** The phone layout: lesson on top, instrument docked at the bottom. Keep in step with app.css. */
export const DOCKED = '(max-width: 700px)';

export function App() {
  const docked = useMedia(DOCKED);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    const onPop = () => {
      const fromPath = langFromPath(location.pathname);
      if (fromPath) applyLang(fromPath, 'none');
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  return (
    <div class={`app${started.value ? ' is-started' : ''}`}>
      <main class="app__lesson">
        <Identity />
        <Lesson />
      </main>
      <Instrument compact={docked} />
      {import.meta.env.DEV && <DevControl />}
    </div>
  );
}
