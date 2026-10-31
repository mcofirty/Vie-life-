// Mise en cache pour un fonctionnement hors ligne.
const CACHE = "lifelot-app-v39";
const FILES = ["./", "index.html", "app.css?v=39", "app.js?v=39", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "../countries.js?v=39", "../data.js?v=39", "../sim.js?v=39", "../economy.js?v=39", "../moments.js?v=39", "../careers.js?v=39", "../company.js?v=39", "../stardom.js?v=39", "../politics.js?v=39", "../spending.js?v=39", "../common.js?v=39", "../leagues.js?v=39", "../club.js?v=39", "../sport.js?v=39", "../bourse.js?v=39", "../multiclub.js?v=39"];

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
