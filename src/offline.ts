/**
 * Registers the service worker (build/sw-template.js) in the built site only, so Merel works
 * offline after the first visit. It also looks for a new release each time the app comes back
 * into view, which matters on a phone where the app is rarely closed.
 */
export function keepOffline(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void registration.update().catch(() => undefined);
        });
      })
      .catch(() => undefined); // no worker (private mode, an old browser): Merel still works online
  });
}
