const CACHE_NAME = 'dreambees-runtime-v3';

const shouldCache = (request) => {
    if (request.method !== 'GET') return false;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;

    // Never cache HTML, JS, or CSS so fresh builds are always fetched.
    if (
        request.destination === 'document' ||
        request.destination === 'script' ||
        request.destination === 'style' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css')
    ) {
        return false;
    }

    // Avoid caching API calls or dynamic endpoints.
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/functions')) {
        return false;
    }

    return true;
};

// Network-first strategy with minimal runtime caching.
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && shouldCache(event.request)) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

