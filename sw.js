/* OSE Dungeon Turn Tracker — service worker.
 * Після кожного оновлення файлів збільшуйте VERSION, щоб застосунок підхопив зміни. */
const VERSION = "osedtt-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./fonts/alegreya-sans-cyrillic-400-normal.woff2",
  "./fonts/alegreya-sans-cyrillic-500-normal.woff2",
  "./fonts/alegreya-sans-cyrillic-700-normal.woff2",
  "./fonts/alegreya-sans-latin-400-normal.woff2",
  "./fonts/alegreya-sans-latin-500-normal.woff2",
  "./fonts/alegreya-sans-latin-700-normal.woff2",
  "./fonts/alegreya-sc-cyrillic-500-normal.woff2",
  "./fonts/alegreya-sc-cyrillic-700-normal.woff2",
  "./fonts/alegreya-sc-latin-500-normal.woff2",
  "./fonts/alegreya-sc-latin-700-normal.woff2",
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // Сторінка: спершу мережа (щоб підхопити оновлення), офлайн — з кешу.
  if (req.mode === "navigate") {
    event.respondWith(
      Promise.race([fetch(req), timeout(3000)])
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); }
          return res;
        })
        .catch(() => caches.match("./index.html", { ignoreSearch: true }).then(r => r || caches.match("./")))
    );
    return;
  }

  // Решта (шрифти, іконки): спершу кеш.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
