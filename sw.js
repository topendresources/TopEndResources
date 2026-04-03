const CACHE_NAME = 'ter-portal-v5';

// All files to cache on first load
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/worksreport.html',
  '/supervisorreport.html',
  '/onboarding.html',
  '/projects.json',
  '/users.json',
  '/TER-logo.png',
  // jsPDF is now embedded inline — no CDN dependency
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@300;400;500;600&display=swap',
];

// Install — cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching all assets');
      // Cache what we can, skip failures (e.g. fonts may fail without internet)
      return Promise.allSettled(
        CACHE_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
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

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests we don't control
  if (event.request.method !== 'GET') return;
  
  // Skip the Cloudflare Worker API calls — always need network for uploads
  if (event.request.url.includes('workers.dev')) return;
  
  // Skip Microsoft auth — always needs network
  if (event.request.url.includes('microsoftonline.com')) return;
  if (event.request.url.includes('graph.microsoft.com')) return;

  // Skip Turnstile — needs network
  if (event.request.url.includes('challenges.cloudflare.com')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Serve from cache, but also update cache in background if online
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        }).catch(() => cachedResponse); // If network fails, cached is fine
        
        return cachedResponse; // Return cache immediately
      }

      // Not in cache — try network, cache the result
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return networkResponse;
      }).catch(() => {
        // Offline and not cached — return offline page for HTML requests
        if (event.request.headers.get('accept').includes('text/html')) {
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
  // This will be called when connection is restored
  // The actual sync logic lives in the page JS
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_REPORTS' }));
}
