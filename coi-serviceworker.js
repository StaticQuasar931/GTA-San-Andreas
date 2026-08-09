const ISOLATION_HEADERS = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
};

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  const isNavigation = request.mode === "navigate";
  const isEmulatorWorker = url.origin === self.location.origin &&
    (request.destination === "worker" || request.destination === "sharedworker" || url.pathname.endsWith("/Play.js"));
  if (!isNavigation && !isEmulatorWorker) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (!response || response.status === 0) return response;
      const headers = new Headers(response.headers);
      for (const [name, value] of Object.entries(ISOLATION_HEADERS)) headers.set(name, value);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      return new Response(`Runtime fetch failed: ${error.message}`, {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});
