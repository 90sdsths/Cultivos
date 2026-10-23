// sw.js — Cultivos v12. Reemplaza al de la v11 (caché primero), que dejaba la
// versión vieja pegada aunque GitHub ya tuviera la nueva.
// Estrategia: RED PRIMERO. Con internet siempre se ve lo publicado; sin señal,
// la última copia guardada. Al activarse borra TODAS las cachés anteriores.
const CACHE = 'cultivos-v12-2026-10-23';
const ASSETS = ['./', './index.html', './cultivos.html', './analisis_cultivos.html', './manifest.webmanifest',
  './cultivos_catalogo.js', './cultivos_calculos.js', './cultivos_diagramas.js', './cultivos_modulo.js', './tema.js', './fotos.js'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then((ws) => ws.forEach((w) => w.navigate(w.url))));   // recarga las pestañas que tenían la v11
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match('./index.html'))));
});
