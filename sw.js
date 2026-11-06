// Lernsprung: offline nutzbar. Seiten mit cache:'no-cache' (fragt den Server jedes Mal, ob es eine neue Version gibt).
// Seiten immer zuerst frisch aus dem Netz (Updates sofort), sonst aus dem Speicher.
const C = 'lernsprung-v4';
const ROOT = new URL('./', self.registration.scope).pathname;           // /Lernsprung/
const PAGES = [ROOT, ROOT + 'index.html'];
const keyOf = p => p.endsWith('index.html') ? p.slice(0, -10) : p;      // eine Kopie pro Seite
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'manifest.json', 'icon-192.png', 'icon-512.png'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin && PAGES.includes(u.pathname)) {
    const k = keyOf(u.pathname);
    e.respondWith(fetch(r.url, { cache:'no-cache', credentials:'same-origin' }).then(res => { if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(k, cp)); } return res; })
      .catch(() => caches.match(k)));
    return;
  }
  if (u.origin === location.origin || u.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; })));
  }
});
