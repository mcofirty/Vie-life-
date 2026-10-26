// Mise en cache pour un fonctionnement hors ligne.
const CACHE = "lifelot-app-v16";
const FILES = ["./", "index.html", "app.css?v=16", "app.js?v=16", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "../countries.js?v=16", "../data.js?v=16", "../sim.js?v=16", "../economy.js?v=16", "../moments.js?v=16", "../careers.js?v=16", "../company.js?v=16", "../stardom.js?v=16", "../spending.js?v=16", "../common.js?v=16"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request, { cache: "no-cache" }).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
