const CACHE_NAME = 'dreambees-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dreambees_icon.png',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // Only cache successful GET requests from our origin
                if (event.request.method === 'GET' && fetchResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return fetchResponse;
            });
        })
    );
});
