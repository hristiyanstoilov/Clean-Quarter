/**
 * Service Worker for Clean Quarter PWA
 * Handles offline support, caching, and background sync
 */

const CACHE_NAME = 'clean-quarter-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/pages/dashboard.html',
    '/src/pages/create-campaign.html',
    '/src/pages/campaign-detail.html',
    '/src/pages/rewards.html',
    '/src/pages/profile.html',
    '/src/pages/admin.html',
    '/src/style.css',
    '/src/assets/style.css',
    '/src/main.js',
    '/src/services/auth.js',
    '/src/services/map.js',
    '/src/services/storage.js',
    '/src/services/supabase.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        }).catch((error) => {
            console.warn('[Service Worker] Error caching assets:', error);
        })
    );
    self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

/**
 * Fetch event - serve from cache, fallback to network
 * Strategy: Cache First for assets, Network First for API calls
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // API calls - Network First strategy
    if (url.pathname.includes('/rest/v1/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses
                    if (response && response.status === 200) {
                        const cache = caches.open(CACHE_NAME);
                        cache.then((c) => c.put(request, response.clone()));
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached response if offline
                    return caches.match(request);
                })
        );
        return;
    }

    // Static assets - Cache First strategy
    event.respondWith(
        caches.match(request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(request).then((response) => {
                // Cache new responses
                if (response && response.status === 200) {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                }
                return response;
            });
        }).catch(() => {
            // Return offline page or placeholder
            return new Response('Offline - Please check your internet connection', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                    'Content-Type': 'text/plain'
                })
            });
        })
    );
});

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification from Clean Quarter',
            icon: '/images/icon-192x192.png',
            badge: '/images/icon-192x192.png',
            tag: data.tag || 'default',
            requireInteraction: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Clean Quarter', options)
        );
    }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/src/pages/dashboard.html';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if app is already open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open app if not already open
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
