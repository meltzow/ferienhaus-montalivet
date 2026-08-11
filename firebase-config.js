// Öffentliche Firebase-Web-Konfiguration für Phase 2a.
// Die Werte hier sind KEINE Secrets. Der private Serverzugang liegt ausschließlich
// in Firebase/Google Cloud. Push bleibt unsichtbar, bis enabled auf true gesetzt ist.
globalThis.FIREBASE_PUSH = {
  enabled: false,
  sdkVersion: "12.16.0",
  config: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  vapidKey: ""
};
