// Service Worker برای همگام
const CACHE_NAME = 'hamgam-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// نصب Service Worker و cache کردن فایل‌ها
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache failed:', err);
      })
  );
  // فعال شدن فوری Service Worker
  self.skipWaiting();
});

// فعال‌سازی Service Worker و پاک کردن cache‌های قدیمی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // کنترل فوری تمام کلاینت‌ها
  self.clients.claim();
});

// پاسخ به درخواست‌ها
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر در cache موجود است، برگردان
        if (response) {
          return response;
        }
        
        // در غیر این صورت، از شبکه بگیر
        return fetch(event.request).then(
          response => {
            // بررسی پاسخ معتبر
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone پاسخ
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        ).catch(() => {
          // اگر شبکه در دسترس نیست و فایل در cache نیست
          // برای درخواست‌های navigate، صفحه آفلاین برگردان
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
