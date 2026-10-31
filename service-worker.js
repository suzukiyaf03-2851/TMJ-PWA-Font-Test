
"use strict";


"use strict";

// 第10回：アイコン対応キャッシュ
const CACHE_NAME = "tmj-pwa-v013";

// 第108段階：Service Workerの実動作バージョン確認
self.addEventListener("message", event => {
    if (event.data?.type === "GET_SW_VERSION") {
        event.source?.postMessage({
            type: "SW_VERSION",
            version: CACHE_NAME
        });
    }
});

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
            return Promise.resolve();
        })
    );
});

// 第106段階：利用者の操作による更新適用
self.addEventListener("message", event => {
    if (event.data?.type === "SKIP_WAITING") {
        event.waitUntil(self.skipWaiting());
    }
});

// 古いキャッシュを削除
// 第107段階：現行版と直前の旧版のキャッシュを保持
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            const appCaches = keys
                .filter(key => /^tmj-pwa-v\d+$/.test(key))
                .sort((a, b) => {
                    const versionA = Number(a.match(/\d+$/)[0]);
                    const versionB = Number(b.match(/\d+$/)[0]);
                    return versionB - versionA;
                });

            const keepCaches = new Set([
                CACHE_NAME,
                ...appCaches.filter(key => key !== CACHE_NAME).slice(0, 1)
            ]);

            return Promise.all(
                appCaches
                    .filter(key => !keepCaches.has(key))
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

    // 第105段階：ローカル開発時はキャッシュを使用しない
    if (url.hostname === "127.0.0.1" ||
        url.hostname === "localhost") {
        event.respondWith(fetch(event.request));
        return;
    }

    // このPWAの配信元・配信フォルダー内だけを対象とする
    const appBase = new URL(self.registration.scope);

    if (url.origin !== appBase.origin ||
        !url.pathname.startsWith(appBase.pathname)) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(event.request, {
                ignoreSearch: true
            })
        ).then(cached => {
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