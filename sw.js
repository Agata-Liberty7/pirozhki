const CACHE = 'pirozhki-v2';
const ASSETS = ['/pirozhki/', '/pirozhki/index.html', '/pirozhki/admin.html', '/pirozhki/login.html', '/pirozhki/core.js', '/pirozhki/i18n.js', '/pirozhki/style.css', '/pirozhki/manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });
