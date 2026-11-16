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
  navProgress: string;
  staffEmpty: string;
  /** The switch on a singing card: on, it is your turn and Merel listens. */
  sing: string;
  skip: string;
  skipped: string;
  dotsLabel: (dots: number, total: number) => string;
  status: {
    listen: string;
    turn: string;
    /** Your turn while Merel listens. */
    turnListening: string;
    direction: (step: number) => string;
    wrongDirection: string;
    /** Recognition, finding the notes: `found` notes are found so far. */
    find: (found: number) => string;
    wrongNote: (name: string) => string;
    /** A long silence ended a try before all notes were found: sing again from `name`, do. */
    missed: (name: string) => string;
    /** A wrong note was held: try `name`, the next note, again; nothing resets. */
    wrongSung: (name: string) => string;
    /** After two wrong notes or misses: Listen is offered, then sing from `name`, do. */
    hearAgain: (name: string) => string;
    bravo: string;
    levelDone: string;
  };
  /** Merel's microphone: the one-sentence ask before the browser's, and what follows a no. */
  listen: {
    ask: string;
    yes: string;
    no: string;
    /** Said once, when Merel will not listen: refused, missing or failing. */
    off: string;
    /** The quiet link on a card to ask again. */
    again: string;
    later: string;
    /** The browser still refuses after asking again. */
    blocked: string;
    /** The microphone is missing or failed to open, not refused. */
    failed: string;
  };
  up: string;
  down: string;
  /** The answers given in a recognition round, for screen readers. */
  answersLabel: string;
  /** A note still to find, for screen readers. */
  toFind: (n: number) => string;
  progressTitle: string;
  progressText: string;
  progressCode: string;
  copy: string;
  copied: string;
  copyFailed: string;
  pasteLabel: string;
  restore: string;
  restored: string;
  badCode: string;
  startOver: string;
  startOverText: string;
  startOverYes: string;
  startOverNo: string;
  startedOver: string;
  hearIt: string;
  done: string;
  instrument: string;
  instrumentHelp: string;
  dockHide: string;
  dockShow: string;
  /** The accessible label of a key: name, letter, computer key. */
  keyLabel: (name: string, letter: string | null, kbd: string) => string;
  staffLabel: (names: string) => string;
  /** One line each on the first screen, on phones. */
  tips: { headphones: string; silentSwitch: string };
  install: {
    title: string;
    /** On an iPhone or iPad, in Safari: why, and how. */
    iosText: string;
    iosHow: string;
    /** Where the browser can install it itself (Android, Chrome). */
    text: string;
    button: string;
    later: string;
  };
  privacyLink: string;
  privacy: {
    back: string;
    title: string;
    paragraphs: string[];
    aboutTitle: string;
    about: string[];
    code: string;
  };
  merel: { waiting: string; singing: string; thinking: string; listening: string; bowing: string };
}

export const STRINGS: Record<Lang, Strings> = { en, fr, nl };
