const CACHE_NAME = 'tselenko-news-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/js/app.js',
  '/src/js/db.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => cachedResponse || fetch(event.request))
  );
});
