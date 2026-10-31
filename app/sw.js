// Mise en cache pour un fonctionnement hors ligne.
const CACHE = "lifelot-app-v40";
const FILES = ["./", "index.html", "app.css?v=40", "app.js?v=40", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "../countries.js?v=40", "../data.js?v=40", "../sim.js?v=40", "../economy.js?v=40", "../moments.js?v=40", "../careers.js?v=40", "../company.js?v=40", "../stardom.js?v=40", "../politics.js?v=40", "../spending.js?v=40", "../common.js?v=40", "../leagues.js?v=40", "../club.js?v=40", "../sport.js?v=40", "../bourse.js?v=40", "../multiclub.js?v=40", "../fortune.js?v=40"];

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
