const CACHE_NAME = 'ojek-hulu-v1';
const ASSETS = ['/', '/index.html', '/js/main.js', '/js/api.js', '/js/map.js', '/js/auth.js', '/js/history.js'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});