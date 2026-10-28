
"use strict";


"use strict";

// 第10回：アイコン対応キャッシュ
const CACHE_NAME = "tmj-pwa-v008";

const APP_FILES = [
    "./",
    "./index.html",
    "./app.js",
    "./pdf_export.js",
    "./pdf_lib/html2canvas.min.js",
    "./pdf_lib/jspdf.umd.min.js",
    "./manifest.json",
    "./icons/icon-180.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


// インストール時に必要なファイルを保存
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(APP_FILES);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// 古いキャッシュを削除
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key.startsWith("tmj-pwa-") && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

// 第99段階：アプリ本体はキャッシュ優先
// Wi-Fi接続中でも保存済みファイルを利用する

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    const url = new URL(event.request.url);

    // このPWAの配信元・配信フォルダー内だけを対象とする
    const appBase = new URL(self.registration.scope);

    if (url.origin !== appBase.origin ||
        !url.pathname.startsWith(appBase.pathname)) {
        return;
    }

    event.respondWith(
        caches.match(event.request, {
            ignoreSearch: true
        }).then(cached => {
            if (cached) {
                return cached;
            }

            return fetch(event.request).then(response => {
                if (response.ok) {
                    const copy = response.clone();

                    event.waitUntil(
                        caches.open(CACHE_NAME).then(cache =>
                            cache.put(event.request, copy)
                        )
                    );
                }

                return response;
            });
        })
    );
});