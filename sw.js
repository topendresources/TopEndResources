const CACHE_NAME = 'ter-portal-v9';

// Install — activate immediately, no pre-caching (avoids install stalls on mobile)
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate — clean up old caches, claim all clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, cache on success, fall back to cache when offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Always go to network for these — never cache
  if (event.request.url.includes('workers.dev')) return;
  if (event.request.url.includes('microsoftonline.com')) return;
  if (event.request.url.includes('graph.microsoft.com')) return;
  if (event.request.url.includes('challenges.cloudflare.com')) return;
  if (event.request.url.includes('fonts.googleapis.com')) return;
  if (event.request.url.includes('fonts.gstatic.com')) return;

  event.respondWith(
    fetch(event.request).then(networkResponse => {
      // Cache any successful same-origin or CORS response
      if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return networkResponse;
    }).catch(() => {
      // Network failed — serve from cache
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        // Last resort for HTML navigations: return index.html
        if (event.request.headers.get('accept') &&
            event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Background sync for queued submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncQueuedReports());
  }
});

async function syncQueuedReports() {
  // Notify page JS to handle the sync when connection is restored
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_REPORTS' }));
}
