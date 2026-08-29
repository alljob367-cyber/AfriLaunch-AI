// AfriLaunch AI — Service Worker v2 (network-first, no stale cache)
// FIX: The old sw.js was cache-first, which caused the old landing page
// to persist even after updates. This version is NETWORK-FIRST:
// it always fetches from the network first, and only falls back to cache
// when offline.

const CACHE_NAME = 'afrilaunch-v2';
const STATIC_ASSETS = ['/logo.svg', '/favicon.svg', '/manifest.json'];

// Install: pre-cache only static assets (NOT the landing page)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // activate immediately
});

// Activate: delete ALL old caches (v1, v2, anything) to force fresh content
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          // Delete any cache that isn't the current version
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim(); // take control immediately
});

// Fetch: NETWORK-FIRST for HTML pages, cache-first for static assets only
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  const url = new URL(event.request.url);

  // For HTML pages (including /): always fetch from network first
  if (event.request.mode === 'navigate' ||
      event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline: fall back to cache
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // For static assets (images, CSS, JS): cache-first (they're immutable)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
