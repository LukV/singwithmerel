import wordmark from '../../docs/design/assets/signs/wordmark.svg?clean&ink';
import { unlock } from '../audio/tone';
import { preloadVoice } from '../audio/voice';
import { lang, started, t } from '../state';
import { Header } from './Header';
import { HandRule } from './HandRule';
import { Merel } from './merel/Merel';
import { Tips } from './Tips';

/** The first screen: the wordmark, "You play. He sings.", Start, and Merel singing on his line. */
export function Identity() {
  const s = t.value;
  const begin = () => {
    unlock();
    preloadVoice(lang.value);
    started.value = true;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('c1')?.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
  };
  return (
    <section class="identity" aria-labelledby="wordmark">
      <Header />
      <h1 id="wordmark" class="identity__wordmark">
        <span role="img" aria-label="Merel" dangerouslySetInnerHTML={{ __html: wordmark }} />
      </h1>
      <div class="identity__foot">
        <div class="identity__call">
          <p class="identity__tagline lettering">
            {s.tagline[0]}
            <br />
            {s.tagline[1]}
          </p>
          <button type="button" class="button" onClick={begin}>
            {s.start}
          </button>
        </div>
        <div class="identity__merel">
          <Merel pose="singing" live />
          <HandRule class="identity__ground" strokeWidth={5} wobble={2} seed={7} />
        </div>
      </div>
      <Tips />
    </section>
  );
}
