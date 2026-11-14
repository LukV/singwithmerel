import type { Strings } from './strings';

const fr: Strings = {
  langName: 'Français',
  languageLabel: 'Langue',
  navLabel: 'Parties',
  navSing: 'Chanter',
  navRecognise: 'Reconnaître',
  tagline: ['Tu joues.', 'Il chante.'],
  start: 'Commencer',
  noteNames: ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si', 'do'],
  showLetters: false,
  highDo: 'do aigu',
  exercise: (n) => `Exercice ${n} : `,
  exercises: [
    { title: 'Du grave à l’aigu', text: 'Monte la gamme de do à do. Merel chante chaque note par son nom, et tu chantes avec lui.' },
    { title: 'De l’aigu au grave', text: 'Puis redescends, du do aigu au do grave.' },
    { title: 'Chanter une mélodie', text: 'Merel chante trois notes. Écoute, puis chante-les à ton tour.' },
    { title: 'Reconnaître une mélodie', text: 'Merel chante trois notes sur « du ». Ça monte ou ça descend ? Puis trouve-les sur le clavier.' },
  ],
  cardStart: 'Commencer',
  cardAgain: 'Encore',
  hearIt: 'Écouter',
  done: 'Fini.',
  instrument: 'La gamme de do majeur',
  instrumentHelp: 'Clique sur une touche, ou tape A S D F G H J K sur ton clavier : A est le do grave, K le do aigu.',
  dockHide: 'Cacher la portée et le clavier',
  dockShow: 'Montrer la portée et le clavier',
  keyLabel: (name, letter, kbd) => `${name}${letter ? `, ${letter}` : ''}, touche ${kbd.toUpperCase()} du clavier`,
  staffLabel: (names) => `La gamme de do majeur sur la portée : ${names}`,
  merel: {
    waiting: 'Merel attend',
    singing: 'Merel chante',
    thinking: 'Merel réfléchit',
    listening: 'Merel écoute',
    bowing: 'Merel salue',
  },
};

export default fr;
