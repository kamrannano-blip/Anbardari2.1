// Service Worker - نسخه 1.0
const CACHE_NAME = 'davin-accounting-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './DAVIN.PNG',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jalaali-js@1.2.6/dist/jalaali.min.js',
  'https://cdn.jsdelivr.net/gh/font-store/font-IRANSans/IRANSansWeb.css'
];

// نصب اولیه: کش کردن فایل‌ها
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('کش کردن فایل‌ها');
      return cache.addAll(urlsToCache).catch(function(err) {
        console.log('خطا در کش اولیه:', err);
      });
    })
  );
  self.skipWaiting();
});

// فعال‌سازی: پاک کردن کش قدیمی
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتژی: اول کش، بعد شبکه
self.addEventListener('fetch', function(event) {
  // فقط GET رو کش کن
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        // از کش برگردون، ولی در پس‌زمینه هم آپدیت کن
        fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(function(){});
        return response;
      }
      // اگه در کش نبود، از شبکه بگیر و کش کن
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(function() {
        // اگه شبکه هم نبود و صفحه اصلی خواسته شد
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
