// Service worker de Tremplin FLE : l’application s’ouvre et les contenus déjà vus restent
// consultables sans connexion. Les données des comptes (Supabase) et l’IA passent toujours par le réseau.
const VERSION = "tremplin-v2";
const COQUILLE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // Pages : le réseau d’abord (version à jour), la copie locale hors connexion.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copie = r.clone();
          caches.open(VERSION).then((c) => c.put("./index.html", copie));
          return r;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }
  // Fichiers (scripts, styles, icônes, audios) : la copie locale d’abord, mise à jour en arrière-plan.
  e.respondWith(
    caches.match(req).then((enCache) => {
      const reseau = fetch(req)
        .then((r) => {
          if (r.ok) {
            const copie = r.clone();
            caches.open(VERSION).then((c) => c.put(req, copie));
          }
          return r;
        })
        .catch(() => enCache);
      return enCache || reseau;
    }),
  );
});
