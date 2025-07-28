const CACHE_NAME = 'currency-tracker-v15';
const API_CACHE_NAME = 'currency-api-cache-v15';
const urlsToCache = [
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './favicon.svg',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-180x180.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache);
        }),
      caches.open(API_CACHE_NAME)
        .then((cache) => {
          console.log('Opened API cache');
          return cache;
        })
    ]).then(() => {
      console.log('Service Worker installed, skipping waiting...');
      return self.skipWaiting(); // Force the service worker to take control immediately
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle API requests (exchange rates)
  if (url.hostname === 'api.exchangerate-api.com' || url.hostname === 'api.fxratesapi.com') {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Skip other cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle app resources
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream
        const fetchRequest = request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Handle API requests with cache-first strategy for offline support
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);

    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put(request, response.clone());
      return response;
    }

    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cache, return the failed response
    return response;
  } catch (error) {
    // Network error - try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available, return error
    throw error;
  }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        // Delete old caches
        ...cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
        // Take control of all clients immediately
        self.clients.claim()
      ]);
    }).then(() => {
      console.log('Service Worker activated and took control');
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'currency-data-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // This would handle syncing cached currency data when back online
  console.log('Background sync triggered');
  return Promise.resolve();
}
