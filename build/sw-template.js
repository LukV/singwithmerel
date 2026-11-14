/* Merel's service worker, written into dist/sw.js by build/service-worker.ts.
   At the first visit it keeps every file of the app, so Merel starts and sings offline.
   Pages come from the network when there is one, so the next start shows a new release; a new
   build is also a new cache, fetched in the background, which then replaces the old one. */
const VERSION = '__VERSION__';
const FILES = __FILES__;
const CACHE = `merel-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('merel-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** The file a page address stands for: `/fr/` and `/fr` are `/fr/index.html`. */
function pageFile(pathname) {
  if (pathname.endsWith('/')) return `${pathname}index.html`;
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  return last.includes('.') ? pathname : `${pathname}/index.html`;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Pages: the network first, so an update shows, then the kept copy, then the root page.
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(pageFile(url.pathname))) ?? (await cache.match('/index.html')) ?? Response.error();
      }),
    );
    return;
  }

  // Everything else: the kept copy first; what is not kept comes from the network.
  event.respondWith(caches.open(CACHE).then((cache) => cache.match(url.pathname)).then((hit) => hit ?? fetch(request)));
});
