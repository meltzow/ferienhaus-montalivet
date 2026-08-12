// Öffentliche Firebase-Web-Konfiguration für Phase 2a.
// Diese Werte sind für eine Firebase-Web-App öffentlich und keine Server-Secrets.
// Das kostenlose Backend läuft über GitHub Actions. Push wird nach dem einmaligen
// Einrichten des GitHub-Secrets und der Firestore-Regeln aktiviert.
globalThis.FIREBASE_PUSH = {
  enabled: false,
  sdkVersion: "12.17.1",
  config: {
    apiKey: "AIzaSyAC4GqV1q2c44S5ZL8o0lj0nTtMkkkyx-4",
    authDomain: "ferienhaus-montalivet.firebaseapp.com",
    projectId: "ferienhaus-montalivet",
    storageBucket: "ferienhaus-montalivet.firebasestorage.app",
    messagingSenderId: "1036112467100",
    appId: "1:1036112467100:web:90adb531f1d271c8c3c959"
  },
  vapidKey: "BIKhcIVotZhhw5GuPPnioPKIhln_R1XWBnYMZXe2oJhsW6lKhREHKWiAORZ7AAGSrG-xAJGkABBq4qKTf_3aJMM"
};
