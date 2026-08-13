importScripts("./firebase-config.js");

if (globalThis.FIREBASE_PUSH?.enabled) {
  const firebaseVersion = globalThis.FIREBASE_PUSH.sdkVersion || "12.16.0";
  importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js`);
  importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-messaging-compat.js`);
  firebase.initializeApp(globalThis.FIREBASE_PUSH.config);
  firebase.messaging();
}
