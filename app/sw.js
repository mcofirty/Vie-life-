// Mise en cache pour un fonctionnement hors ligne.
const CACHE = "lifelot-app-v38";
const FILES = ["./", "index.html", "app.css?v=38", "app.js?v=38", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "../countries.js?v=38", "../data.js?v=38", "../sim.js?v=38", "../economy.js?v=38", "../moments.js?v=38", "../careers.js?v=38", "../company.js?v=38", "../stardom.js?v=38", "../politics.js?v=38", "../spending.js?v=38", "../common.js?v=38", "../leagues.js?v=38", "../club.js?v=38", "../sport.js?v=38", "../bourse.js?v=38"];

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
