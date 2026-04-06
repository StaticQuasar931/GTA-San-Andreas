self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

  event.respondWith((async () => {
    const response = await fetch(request);
    if (!response || response.status === 0) return response;

    const headers = new Headers(response.headers);
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "reload-window") {
    self.clients.matchAll({ type: "window" }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    });
  }
});
