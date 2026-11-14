import type { Strings } from './strings';

const en: Strings = {
  langName: 'English',
  languageLabel: 'Language',
  navLabel: 'Sections',
  navSing: 'Sing',
  navRecognise: 'Recognise',
  tagline: ['You play.', 'He sings.'],
  start: 'Start',
  noteNames: ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti', 'do'],
  showLetters: true,
  highDo: 'high do',
  exercise: (n) => `Exercise ${n}: `,
  exercises: [
    { title: 'Low to high', text: 'Climb the scale from do to do. Merel sings each note by its name, and you sing along.' },
    { title: 'High to low', text: 'Now come back down, from high do to low do.' },
    { title: 'Sing a melody', text: 'Merel sings three notes. Listen, then sing them back.' },
    { title: 'Recognise a melody', text: 'Merel sings three notes on “du”. Up or down? Then find them on the keys.' },
  ],
  cardStart: 'Start',
  cardAgain: 'Again',
  hearIt: 'Hear it',
  done: 'Done.',
  instrument: 'The scale of do major',
  instrumentHelp: 'Click a key, or type A S D F G H J K on your keyboard: A is low do, K is high do.',
  keyLabel: (name, letter, kbd) => `${name}${letter ? `, ${letter}` : ''}, keyboard key ${kbd.toUpperCase()}`,
  staffLabel: (names) => `The scale of do major on the staff: ${names}`,
  merel: {
    waiting: 'Merel waits',
    singing: 'Merel sings',
    thinking: 'Merel thinks',
    listening: 'Merel listens',
    bowing: 'Merel bows',
  },
};

export default en;
