import type { Strings } from './strings';

const nl: Strings = {
  langName: 'Nederlands',
  languageLabel: 'Taal',
  navLabel: 'Onderdelen',
  navSing: 'Zingen',
  navRecognise: 'Herkennen',
  tagline: ['Jij speelt.', 'Hij zingt.'],
  start: 'Begin',
  noteNames: ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do'],
  showLetters: true,
  highDo: 'hoge do',
  exercise: (n) => `Oefening ${n}: `,
  exercises: [
    { title: 'Van laag naar hoog', text: 'Klim de toonladder op, van do tot do. Merel zingt elke noot bij naam, en jij zingt mee.' },
    { title: 'Van hoog naar laag', text: 'En nu weer naar beneden, van hoge do naar lage do.' },
    { title: 'Zing een melodie', text: 'Merel zingt drie noten. Luister, en zing ze dan terug.' },
    { title: 'Herken een melodie', text: 'Merel zingt drie noten op „du”. Gaat het omhoog of omlaag? Zoek ze dan op de toetsen.' },
  ],
  cardStart: 'Begin',
  cardAgain: 'Opnieuw',
  hearIt: 'Luister',
  done: 'Klaar.',
  instrument: 'De toonladder van do groot',
  instrumentHelp: 'Klik op een toets, of typ A S D F G H J K op je toetsenbord: A is de lage do, K de hoge do.',
  dockHide: 'Verberg de notenbalk en de toetsen',
  dockShow: 'Toon de notenbalk en de toetsen',
  keyLabel: (name, letter, kbd) => `${name}${letter ? `, ${letter}` : ''}, toets ${kbd.toUpperCase()}`,
  staffLabel: (names) => `De toonladder van do groot op de notenbalk: ${names}`,
  merel: {
    waiting: 'Merel wacht',
    singing: 'Merel zingt',
    thinking: 'Merel denkt na',
    listening: 'Merel luistert',
    bowing: 'Merel buigt',
  },
};

export default nl;
