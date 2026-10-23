// Offline-first cache: everything fetched once is served from cache afterwards.
const CACHE = "signal-v18";
const B = self.registration.scope;
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll([B, B+'arena.html', B+'manifest.webmanifest', B+'icon.svg', B+"content/chapter-01.json", B+"content/chapter-02.json", B+"content/chapter-03.json", B+"content/chapter-04.json", B+"content/chapter-05.json", B+"content/chapter-06.json", B+"content/chapter-07.json", B+"content/chapter-08.json", B+"content/chapter-09.json", B+"content/chapter-10.json", B+"content/chapter-11.json", B+"content/chapter-12.json", B+"content/chapter-13.json", B+"content/chapter-14.json", B+"content/chapter-15.json", B+"content/chapter-16.json", ...['tr','gb','us','de','es','it','fr','jp','kr','az','kz','mx','eg','br'].map(c => B+`flags/${c}.svg`)]))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }).catch(() => hit)));
});
