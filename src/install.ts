import { signal } from '@preact/signals';

/**
 * Adding Merel to the home screen. Chrome and Android offer an install prompt, kept here until
 * the invitation uses it; Safari on an iPhone or iPad has no prompt, only Share, then
 * "Add to Home Screen", which the invitation explains.
 */

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const KEY = 'merel.install';

/** The browser's install prompt, when it has offered one. */
export const installPrompt = signal<InstallPrompt | null>(null);
/** Whether the invitation was answered ("Not now", or installed), so it does not come back. */
export const installAnswered = signal(read());

function read(): boolean {
  try {
    return globalThis.localStorage?.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function answerInstall(value: 'later' | 'installed'): void {
  installAnswered.value = true;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // storage blocked: the invitation simply comes back next time
  }
}

/** An iPhone or iPad (iPadOS reports itself as a Mac with a touch screen). */
export const isIos = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** Whether Merel already runs from the home screen. */
export const isInstalled = () =>
  (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) ||
  (typeof navigator !== 'undefined' && (navigator as { standalone?: boolean }).standalone === true);

export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // the invitation asks at the right moment, after a level
    installPrompt.value = event as InstallPrompt;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt.value = null;
    answerInstall('installed');
  });
}

export async function install(): Promise<void> {
  const prompt = installPrompt.value;
  if (!prompt) return;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  installPrompt.value = null;
  answerInstall(outcome === 'accepted' ? 'installed' : 'later');
}
