// 教師專用小工具 PWA Service Worker
// v20.9：恢復慕夏／星雲完整裝飾層，四主題各自向量圖示。

const CACHE_PREFIX = 'hw-tracker-';
const CACHE_NAME = 'hw-tracker-v20-9';
const BUILD_ID = 'limu-teacher-v20-9-20260727';
// 頁面會核對這個完整字面標記；不可改回由兩段字串拼接，否則會再次誤報。
const DEPLOYMENT_MARKER = 'limu-teacher-v20-9-20260727|hw-tracker-v20-9';
const PRECACHE_URLS = [
  './index.html',
  './version.json',
  './react-dom.production.min.js',
  './manifest.webmanifest',
  './app-icon.svg',
  './app-icon-192.png',
  './app-icon-512.png',
  './assets/apple-touch-icon.jpg',
  './assets/gallery-forward.jpg',
  './assets/login-background.jpg',
  './assets/splash-art.jpg',
  './assets/signature-blue-iris.webp'
];

function fetchFresh(url) {
  return fetch(url, { cache:'no-store' }).then(function(response) {
    if (!response || !response.ok) throw new Error(url + ' unavailable');
    return response;
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    Promise.all([
      fetchFresh('./version.json').then(function(response) { return response.json(); }),
      fetchFresh('./index.html').then(function(response) { return response.text(); }),
      fetchFresh('./sw.js').then(function(response) { return response.text(); })
    ]).then(function(results) {
      var info = results[0] || {};
      if (
        info.buildId !== BUILD_ID ||
        info.cacheName !== CACHE_NAME ||
        results[1].indexOf(BUILD_ID) < 0 ||
        results[2].indexOf(DEPLOYMENT_MARKER) < 0
      ) {
        throw new Error('LIMU deployment files are from different builds');
      }
      return caches.open(CACHE_NAME);
    }).then(function(cache) {
      return Promise.all(PRECACHE_URLS.map(function(url) {
        return fetchFresh(url).then(function(response) {
          return cache.put(url, response);
        });
      }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('message', function(event) {
  var data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (data.type === 'GET_BUILD_INFO' && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ buildId:BUILD_ID, cacheName:CACHE_NAME });
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(key) {
        return key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME;
      }).map(function(key) { return caches.delete(key); }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);

  // 第三方服務（Firebase、登入與字型）不寫入 App 快取。
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request).catch(function() {
      return new Response('', { status:503, statusText:'Offline' });
    }));
    return;
  }

  // 導覽一律繞過 HTTP 快取；伺服器若暫時仍回舊 HTML，改用已驗證的 v20.9 App Shell。
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache:'no-store' }).then(function(response) {
        if (!response || !response.ok) throw new Error('navigation unavailable');
        var cacheCopy = response.clone();
        return response.clone().text().then(function(text) {
          if (text.indexOf(BUILD_ID) < 0) {
            return caches.match('./index.html').then(function(cached) {
              return cached || response;
            });
          }
          event.waitUntil(
            caches.open(CACHE_NAME).then(function(cache) {
              return cache.put('./index.html', cacheCopy);
            }).catch(function() {})
          );
          return response;
        });
      }).catch(function() {
        return caches.match('./index.html').then(function(cached) {
          return cached || new Response('App is unavailable offline.', {
            status:503,
            headers:{ 'Content-Type':'text/plain; charset=utf-8' }
          });
        });
      })
    );
    return;
  }

  // 版本檔與 Service Worker 檔永遠先讀網路，供頁面判斷是否有完整新建置。
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js')) {
    event.respondWith(fetch(event.request, { cache:'no-store' }).catch(function() {
      var fallback = url.pathname.endsWith('/version.json') ? './version.json' : './sw.js';
      return caches.match(fallback).then(function(cached) {
        return cached || new Response('{}', {
          status:503,
          headers:{ 'Content-Type':'application/json; charset=utf-8' }
        });
      });
    }));
    return;
  }

  // 其餘同源靜態資源採快取優先，背景更新。
  event.respondWith(caches.match(event.request).then(function(cached) {
    var update = fetch(event.request).then(function(response) {
      if (response && response.ok && response.type === 'basic') {
        return caches.open(CACHE_NAME).then(function(cache) {
          return cache.put(event.request, response.clone()).then(function() {
            return response;
          });
        });
      }
      return response;
    });
    if (cached) {
      event.waitUntil(update.catch(function() {}));
      return cached;
    }
    return update.catch(function() {
      return new Response('', { status:503, statusText:'Offline' });
    });
  }));
});
