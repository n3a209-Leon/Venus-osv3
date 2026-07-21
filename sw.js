// 教師專用小工具 PWA Service Worker
// 導覽採 Network First，靜態檔採 Stale While Revalidate。

const CACHE_PREFIX = 'hw-tracker-';
const CACHE_NAME = CACHE_PREFIX + 'v9';
const PRECACHE_URLS = [
  './index.html',
  './react-dom.production.min.js',
  './manifest.webmanifest',
  './app-icon.svg',
  './app-icon-192.png',
  './app-icon-512.png',
  './assets/apple-touch-icon.jpg',
  './assets/gallery-forward.jpg',
  './assets/login-background.jpg',
  './assets/splash-art.jpg'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(PRECACHE_URLS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(key) {
        return key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME;
      }).map(function(key) { return caches.delete(key); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);

  // 第三方服務（Firebase、登入與字型）不寫入 App 快取。
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request).catch(function() {
      return new Response('', { status: 503, statusText: 'Offline' });
    }));
    return;
  }

  // HTML 導覽優先取最新版；離線時回到已快取的 App Shell。
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response && response.ok) {
          event.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
            return cache.put('./index.html', response.clone());
          }));
        }
        return response;
      }).catch(function() {
        return caches.match('./index.html').then(function(cached) {
          return cached || new Response('App is unavailable offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
    );
    return;
  }

  // 同源靜態資源快速回傳快取，並以 waitUntil 保證背景更新完成。
  event.respondWith(caches.match(event.request).then(function(cached) {
    var update = fetch(event.request).then(function(response) {
      if (response && response.ok && response.type === 'basic') {
        return caches.open(CACHE_NAME).then(function(cache) {
          return cache.put(event.request, response.clone()).then(function() { return response; });
        });
      }
      return response;
    });
    if (cached) {
      event.waitUntil(update.catch(function() {}));
      return cached;
    }
    return update.catch(function() {
      return new Response('', { status: 503, statusText: 'Offline' });
    });
  }));
});
