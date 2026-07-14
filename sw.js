const CACHE = "leprenom-v1";
const ASSETS = [
  "./", "./index.html", "./css/styles.css", "./manifest.json",
  "./data/prenoms.json",
  "./js/app.js", "./js/config.js", "./js/catalog.js", "./js/stars.js",
  "./js/profile.js", "./js/game.js", "./js/duel.js", "./js/elo.js",
  "./js/dashboard.js", "./js/aggregate.js", "./js/favoris.js",
  "./js/fiche.js", "./js/ia.js", "./js/supabase.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Réseau d'abord pour Supabase (API/functions), cache d'abord pour le reste
  if (url.host.includes("supabase.co") || url.host.includes("esm.sh")) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
