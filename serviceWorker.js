/* serviceWorker.js */
// (参考) https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps/Offline_Service_workers
'use strict';

const cacheName = 'bgKifuViewerEditor-v20261005';
const ORIGIN = location.origin; //ポート番号を含むorigin(LAN内IP:ポートなどでも動作させる)

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
  ORIGIN + '/bgKifuViewerEditor/js/BgDomUtil_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgSvgChequer_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgKfInputBoard_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgKifu_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgKifuEditor_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgKifuParser_class.js',
  ORIGIN + '/bgKifuViewerEditor/js/BgMoveStrUtil_class.js',
  ORIGIN + '/css/font-awesome-animation.min.css',
  ORIGIN + '/css/bgStaticBoard.css',
  ORIGIN + '/css/FloatWindow4.css',
  ORIGIN + '/css/TableOperator.css',
  ORIGIN + '/js/fontawesome-inuse.min.js',
  ORIGIN + '/js/FloatWindow4.js',
  ORIGIN + '/js/TableOperator_class.js',
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
        //正常応答(200番台)かつhttp(s)のGETだけキャッシュする
        //(404/500のキャッシュ固定化や、chrome-extension: 等のエラーを防ぐ)
        if (response.ok && e.request.method === 'GET' && e.request.url.startsWith('http')) {
          const copy = response.clone();
          caches.open(cacheName).then((cache) => cache.put(e.request, copy));
        }
        return response;
      }).catch(() => Response.error()); //オフラインで未キャッシュの場合は通常のネットワークエラーとして扱う
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
