const CACHE = "texlib-v1";
const CORE = [
  "/", "/assets/app.css", "/assets/bookshelf.js", "/assets/reader.js",
  "/vendor/katex/katex.min.css", "/vendor/katex/katex.min.js",
  "/vendor/katex/auto-render.min.js", "/vendor/hljs/highlight.min.js",
  "/vendor/hljs/github.min.css", "/icon.svg", "/manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
