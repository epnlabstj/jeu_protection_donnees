const CACHE_NAME = 'cyberdetective-v1';
const ASSETS = [
  '/',
  'index.html',
  'script.js',
  'indices.json',
  'https://cdn-icons-png.flaticon.com/512/2921/2921226.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});