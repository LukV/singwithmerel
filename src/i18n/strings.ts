import type { Lang } from './langs';
import en from './en';
import fr from './fr';
import nl from './nl';

export interface Strings {
  /** The name of the language, in itself, for the switch. */
  langName: string;
  languageLabel: string;
  navLabel: string;
  navSing: string;
  navRecognise: string;
  tagline: [string, string];
  start: string;
  /** Solfege names from low do to high do. */
  noteNames: [string, string, string, string, string, string, string, string];
  /** Whether letter names (C D E ...) are shown next to the solfege names. */
  showLetters: boolean;
  highDo: string;
  exercise: (n: number) => string;
  exercises: { title: string; text: string }[];
  cardStart: string;
  cardAgain: string;
  hearIt: string;
  done: string;
  instrument: string;
  instrumentHelp: string;
  dockHide: string;
  dockShow: string;
  /** The accessible label of a key: name, letter, computer key. */
  keyLabel: (name: string, letter: string | null, kbd: string) => string;
  staffLabel: (names: string) => string;
  merel: { waiting: string; singing: string; thinking: string; listening: string; bowing: string };
}

export const STRINGS: Record<Lang, Strings> = { en, fr, nl };
