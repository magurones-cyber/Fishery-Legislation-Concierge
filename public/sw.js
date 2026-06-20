const CACHE_NAME = "fisheries-law-concierge-v3";
const STATIC_ASSETS = ["/icon.svg"];
const PUBLIC_PAGE_PATHS = ["/terms", "/privacy"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;
  const canCache = STATIC_ASSETS.includes(url.pathname) || PUBLIC_PAGE_PATHS.includes(url.pathname) || url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
  if (!canCache) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response.ok) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || new Response("オフラインです。通信を確認して再度お試しください。", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } })))
  );
});
