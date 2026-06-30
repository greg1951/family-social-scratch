const CACHE_VERSION = "v1";
const PRECACHE_NAME = `family-social-precache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/images/family-social-logo-transparent.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("family-social-precache-") && cacheName !== PRECACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(async () => {
        const cache = await caches.open(PRECACHE_NAME);
        const cachedResponse = await cache.match(OFFLINE_URL);
        return cachedResponse ?? new Response("Offline", { status: 503, statusText: "Offline" });
      })
  );
});