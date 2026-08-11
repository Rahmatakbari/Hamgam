/* ══════════════════════════════════════════════════════════════
   Service Worker — فروشگاه هم‌گام
   ──────────────────────────────────────────────────────────────
   استراتژی: Cache-First برای فایل‌های استاتیک
   یعنی اول از cache می‌خواند، اگر نبود از شبکه می‌گیرد و cache می‌کند.
   ══════════════════════════════════════════════════════════════ */

var CACHE_NAME = 'hamgam-v1';
var ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* ─── نصب: cache کردن فایل‌های اصلی ─── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  // فعال شدن فوری (بدون انتظار برای بستن تب‌های قدیمی)
  self.skipWaiting();
});

/* ─── فعال‌سازی: پاک کردن cache های قدیمی ─── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  // کنترل فوری همه تب‌ها
  self.clients.claim();
});

/* ─── درخواست‌ها: Cache-First ─── */
self.addEventListener('fetch', function(event) {
  // فقط درخواست‌های GET را cache کن
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // اگر در cache بود، برگردان + در پس‌زمینه به‌روزرسانی کن
      var fetchPromise = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // اگر شبکه نبود و cache هم نبود
        return cached;
      });

      return cached || fetchPromise;
    })
  );
});
