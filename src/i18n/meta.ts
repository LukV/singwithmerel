import type { Lang } from './langs';

/** The page titles and description, per language; used at build time and at runtime. */
export const pageMeta: Record<Lang, { title: string; privacyTitle: string; description: string }> = {
  en: {
    title: 'Merel: sing with Merel',
    privacyTitle: 'Privacy and about: Merel',
    description: 'Learn to sing a scale and recognise notes by ear, with solfege. Free, no account.',
  },
  fr: {
    title: 'Merel : chante avec Merel',
    privacyTitle: 'Confidentialité et à propos : Merel',
    description: 'Apprends à chanter une gamme et à reconnaître les notes à l’oreille, en solfège. Gratuit, sans compte.',
  },
  nl: {
    title: 'Merel: zing met Merel',
    privacyTitle: 'Privacy en over Merel: Merel',
    description: 'Leer een toonladder zingen en noten herkennen op het gehoor, met solfège. Gratis, zonder account.',
  },
};
