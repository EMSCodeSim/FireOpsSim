/**
 * FireOpsSim service worker.
 * Caches the Skill Support shell, styles, last-used tools, and catalog JSON so
 * a firefighter can keep practicing on weak station Wi-Fi. HTML stays network-first.
 */
const VERSION = 'fos-sw-v1';
const PRECACHE = [
  '/',
  '/skill-support.html',
  '/styles.css',
  '/calc-tools.js',
  '/js/skill-support.js',
  '/js/fos-analytics.js',
  '/js/fos-pwa.js',
  '/site.webmanifest',
  '/data/skill-support/index.json',
  '/data/skill-support/summaries.json',
  '/hydrant-flow-calculator.html',
  '/fire-pump-calculator.html',
  '/training.html',
  '/tools.html',
  '/my-fire-career.html',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

function isNavigate(request, url) {
  return request.mode === 'navigate'
    || url.pathname === '/'
    || url.pathname.endsWith('.html');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigate(request, url)) {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request).then((hit) => hit || caches.match('/skill-support.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
