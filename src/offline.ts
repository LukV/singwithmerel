import { effect } from '@preact/signals';
import { round } from './round/controller';

/**
 * Registers the service worker (build/sw-template.js) in the built site only, so Merel works
 * offline after the first visit. It also looks for a new release each time the app comes back
 * into view, which matters on a phone where the app is rarely closed.
 *
 * When a new release has taken over while the page is open, the page reloads itself quietly,
 * so an installed app that is only ever resumed still moves on: at once if no round is under
 * way, otherwise when the round is closed or the app goes to the background. Progress is kept
 * on the device, so a reload loses nothing.
 */
export function keepOffline(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  // The first worker of a first visit also takes over; that is not a new release.
  const hadWorker = !!navigator.serviceWorker.controller;
  let reloading = false;
  let waiting = false;

  const reload = () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  };
  const reloadWhenIdle = () => {
    if (!waiting) return;
    if (document.visibilityState === 'hidden' || round.value === null) reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadWorker) return;
    waiting = true;
    reloadWhenIdle();
  });
  effect(() => {
    void round.value; // a round that closes is a good moment
    reloadWhenIdle();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void registration.update().catch(() => undefined);
          else reloadWhenIdle();
        });
      })
      .catch(() => undefined); // no worker (private mode, an old browser): Merel still works online
  });
}
