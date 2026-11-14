import { render } from 'preact';
import '@fontsource/kalam/latin-700.css';
import '@fontsource/hanken-grotesk/latin-300.css';
import '@fontsource/hanken-grotesk/latin-400.css';
import '@fontsource/hanken-grotesk/latin-500.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './app';
import { initLang } from './state';

initLang();
render(<App />, document.getElementById('app')!);
