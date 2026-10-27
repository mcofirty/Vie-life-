// Mise en cache pour un fonctionnement hors ligne.
const CACHE = "lifelot-app-v27";
const FILES = ["./", "index.html", "app.css?v=27", "app.js?v=27", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "../countries.js?v=27", "../data.js?v=27", "../sim.js?v=27", "../economy.js?v=27", "../moments.js?v=27", "../careers.js?v=27", "../company.js?v=27", "../stardom.js?v=27", "../politics.js?v=27", "../spending.js?v=27", "../common.js?v=27"];

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
