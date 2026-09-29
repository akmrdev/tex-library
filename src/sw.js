const CACHE = "texlib-__BUILD_VERSION__";
const CORE = [
  "/", "/assets/app.css", "/assets/bookshelf.js", "/assets/reader.js", "/assets/prefs.js",
  "/vendor/katex/katex.min.css", "/vendor/hljs/highlight.min.js",
  "/vendor/hljs/github.min.css", "/vendor/hljs/github-dark.min.css",
  "/icon.svg", "/manifest.webmanifest",
  "/rsvp/", "/rsvp-books.json", "/tts/"
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
  const req = e.request;
  const accept = req.headers.get("accept") || "";
  const isHtml = req.mode === "navigate" || accept.includes("text/html");

  if (isHtml) {
    // HTML は常に新しいものを優先(network-first)。オフライン時のみキャッシュ。
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  // 静的アセットは cache-first(バージョン付きキャッシュでデプロイごとに更新)
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
