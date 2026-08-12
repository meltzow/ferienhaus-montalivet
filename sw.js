// Firebase Cloud Messaging wird nur geladen, wenn Phase 2a vollständig konfiguriert ist.
try {
  importScripts("./firebase-config.js");
  if (globalThis.FIREBASE_PUSH?.enabled) {
    const firebaseVersion = globalThis.FIREBASE_PUSH.sdkVersion || "12.17.1";
    importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js`);
    importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-messaging-compat.js`);
    firebase.initializeApp(globalThis.FIREBASE_PUSH.config);
    firebase.messaging();
  }
} catch (error) {
  console.warn("Firebase Messaging konnte im Service Worker nicht initialisiert werden.", error);
}

const CACHE = "ferienhaus-phase1-v1.5";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./firebase-config.js",
  "./house-data.js",
  "./app.js",
  "./push.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
    )
  );
});
