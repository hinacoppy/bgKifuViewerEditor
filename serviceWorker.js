/* serviceWorker.js */
// (参考) https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps/Offline_Service_workers
'use strict';

const cacheName = 'bgKifuViewerEditor-v20251001';
const ORIGIN = (location.hostname == 'localhost') ? '' : location.protocol + '//' + location.hostname;

const contentToCache = [
  ORIGIN + '/bgKifuViewerEditor/',
  ORIGIN + '/bgKifuViewerEditor/index.html',
  ORIGIN + '/bgKifuViewerEditor/kifuViewerEditor.html',
  ORIGIN + '/bgKifuViewerEditor/manifest.json',
  ORIGIN + '/bgKifuViewerEditor/icon/favicon.ico',
  ORIGIN + '/bgKifuViewerEditor/icon/apple-touch-icon.png',
  ORIGIN + '/bgKifuViewerEditor/icon/android-chrome-96x96.png',
  ORIGIN + '/bgKifuViewerEditor/icon/android-chrome-192x192.png',
  ORIGIN + '/bgKifuViewerEditor/icon/android-chrome-512x512.png',
  ORIGIN + '/bgKifuViewerEditor/css/BgKifuEditor.css',
  ORIGIN + '/bgKifuViewerEditor/css/bootstrap.inuse.css',
  ORIGIN + '/bgKifuViewerEditor/js/BgMoveStrUtil_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgKfInputBoard_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgKifu_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgKifuEditor_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgKifuParser_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgMoveStrUtil_class.js',
  ORIGIN + '/css/font-awesome-animation.min.css',
  ORIGIN + '/css/bgStaticBoard.css',
  ORIGIN + '/css/FloatWindow4.css',
  ORIGIN + '/js/fontawesome-inuse.min.js',
  ORIGIN + '/js/jquery-3.7.1.min.js',
  ORIGIN + '/js/FloatWindow4.js',
  ORIGIN + '/js/BgChequer_class.js',
  ORIGIN + '/js/BgXgid_class.js',
  ORIGIN + '/js/BgUtil_class.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(contentToCache);
    })
  );
  self.skipWaiting();
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      return r || fetch(e.request).then((response) => {
        return caches.open(cacheName).then((cache) => {
          if (e.request.url.startsWith('http')) { //ignore chrome-extention: request (refuse error msg)
            cache.put(e.request, response.clone());
          }
          return response;
        });
      });
    })
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        const [kyappname, kyversion] = key.split('-');
        const [cnappname, cnversion] = cacheName.split('-');
        if (kyappname === cnappname && kyversion !== cnversion) {
          return caches.delete(key);
        }
      }));
    })
  );
});
