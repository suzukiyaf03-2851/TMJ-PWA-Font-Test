
"use strict";


"use strict";

// 第10回：アイコン対応キャッシュ
const CACHE_NAME = "tmj-pwa-v005";

const APP_FILES = [
    "./",
    "./index.html",
    "./app.js",
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

// 通常は通信、オフライン時はキャッシュを利用
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    const url = new URL(event.request.url);

    // このアプリと同じ配信元だけを対象にする
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request).then(response => {
            if (response.ok) {
                const copy = response.clone();

                event.waitUntil(
                    caches.open(CACHE_NAME).then(cache => {
                        return cache.put(event.request, copy);
                    })
                );
            }

            return response;
        }).catch(async () => {
            const cached = await caches.match(
                event.request,
                { ignoreSearch: true }
            );

            return cached || Response.error();
        })
    );
});
