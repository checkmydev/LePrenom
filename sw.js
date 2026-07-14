const CACHE = "leprenom-v12";
const ASSETS = [
  "./", "./index.html", "./css/styles.css", "./manifest.json",
  "./data/prenoms.json",
  "./js/app.js", "./js/config.js", "./js/catalog.js", "./js/stars.js",
  "./js/profile.js", "./js/game.js", "./js/duel.js", "./js/elo.js",
  "./js/dashboard.js", "./js/aggregate.js", "./js/favoris.js",
  "./js/fiche.js", "./js/ia.js", "./js/supabase.js",
];

self.addEventListener("install", (e) => {
  // cache:"reload" => on ignore le cache HTTP et on télécharge les fichiers frais à chaque version.
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Supabase (API/Edge Functions) : toujours le réseau, jamais de cache (données live).
  if (url.host.includes("supabase.co")) return;
  // esm.sh (lib Supabase et ses dépendances) : cache runtime pour permettre
  // le démarrage hors-ligne après un premier chargement en ligne.
  if (url.host.includes("esm.sh")) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      }).catch(() => caches.match(e.request)))
    );
    return;
  }
  // App-shell et assets locaux : cache d'abord, réseau en secours.
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
