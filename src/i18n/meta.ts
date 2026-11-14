import type { Lang } from './langs';

/** The page title and description, per language; used at build time and at runtime. */
export const pageMeta: Record<Lang, { title: string; description: string }> = {
  en: {
    title: 'Merel: sing with Merel',
    description: 'Learn to sing a scale and recognise notes by ear, with solfege. Free, no account.',
  },
  fr: {
    title: 'Merel : chante avec Merel',
    description: 'Apprends à chanter une gamme et à reconnaître les notes à l’oreille, en solfège. Gratuit, sans compte.',
  },
  nl: {
    title: 'Merel: zing met Merel',
    description: 'Leer een toonladder zingen en noten herkennen op het gehoor, met solfège. Gratis, zonder account.',
  },
};
