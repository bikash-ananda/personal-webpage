const CACHE = "bikash-os-public-shell-v2";
const SHELL = ["/", "/offline.html", "/manifest.webmanifest", "/icons/icon.svg"];
const PRIVATE_PREFIXES = ["/workspace", "/api", "/login", "/auth", "/account"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("bikash-os-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isPrivate = PRIVATE_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix + "/"));
  if (isPrivate) {
    if (request.mode === "navigate") {
      event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    }
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok && url.pathname === "/") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy));
        }
        return response;
      }).catch(async () => (await caches.match(request)) || (await caches.match("/offline.html")))
    );
    return;
  }

  const isPublicAsset = url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest";
  if (!isPublicAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
