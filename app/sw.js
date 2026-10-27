// Mise en cache pour un fonctionnement hors ligne.
const CACHE = "lifelot-app-v29";
const FILES = ["./", "index.html", "app.css?v=29", "app.js?v=29", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "../countries.js?v=29", "../data.js?v=29", "../sim.js?v=29", "../economy.js?v=29", "../moments.js?v=29", "../careers.js?v=29", "../company.js?v=29", "../stardom.js?v=29", "../politics.js?v=29", "../spending.js?v=29", "../common.js?v=29"];

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
