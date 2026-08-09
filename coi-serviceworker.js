self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.mode !== "navigate") return;
  event.respondWith((async () => {
    const response = await fetch(request);
    const headers = new Headers(response.headers);
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    return new Response(response.body, { status:response.status, statusText:response.statusText, headers });
  })());
});
