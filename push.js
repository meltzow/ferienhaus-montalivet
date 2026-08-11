const pushSettings = globalThis.FIREBASE_PUSH;
const notificationCard = document.getElementById("notification-card");
const notificationButton = document.getElementById("notification-btn");
const notificationStatus = document.getElementById("notification-status");

if (!notificationCard || !notificationButton || !notificationStatus) {
  console.warn("Push UI not found.");
} else if (!pushSettings?.enabled) {
  // Solange Firebase noch nicht verbunden ist, sehen Gäste keine unfertige Funktion.
  notificationCard.hidden = true;
} else {
  notificationCard.hidden = false;
  initPush().catch(error => {
    console.error("Push initialization failed", error);
    setStatus("Benachrichtigungen konnten nicht initialisiert werden.", "error");
  });
}

async function initPush() {
  const version = pushSettings.sdkVersion || "12.16.0";
  const base = `https://www.gstatic.com/firebasejs/${version}`;

  const [appSdk, authSdk, firestoreSdk, messagingSdk] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
    import(`${base}/firebase-messaging.js`)
  ]);

  const app = appSdk.initializeApp(pushSettings.config);
  const auth = authSdk.getAuth(app);
  const db = firestoreSdk.getFirestore(app);
  const messagingSupported = await messagingSdk.isSupported();

  if (!messagingSupported) {
    notificationButton.disabled = true;
    setStatus("Dieses Gerät bzw. dieser Browser unterstützt Web-Push leider nicht.", "error");
    return;
  }

  const messaging = messagingSdk.getMessaging(app);
  let currentFid = null;

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  if (isIos && !isStandalone) {
    notificationButton.disabled = true;
    setStatus("Auf iPhone/iPad zuerst über Teilen → Zum Home-Bildschirm hinzufügen und die App von dort öffnen.", "info");
    return;
  }

  messagingSdk.onRegistered(messaging, async installationId => {
    currentFid = installationId;
    try {
      const user = await ensureAnonymousUser(auth, authSdk);
      await saveRegistration({ user, installationId, db, firestoreSdk });
      localStorage.setItem("housePushEnabled", "true");
      refreshUi();
    } catch (error) {
      console.error("Could not save FCM registration", error);
      setStatus("Benachrichtigung ist registriert, konnte aber nicht gespeichert werden.", "error");
    }
  });

  messagingSdk.onUnregistered(messaging, async installationId => {
    try {
      const user = auth.currentUser;
      if (user) {
        await firestoreSdk.deleteDoc(firestoreSdk.doc(db, "reminderRegistrations", user.uid));
      }
    } catch (error) {
      console.warn("Could not remove FCM registration", installationId, error);
    }
  });

  notificationButton.addEventListener("click", async () => {
    if (localStorage.getItem("housePushEnabled") === "true") {
      await disablePush();
    } else {
      await enablePush();
    }
  });

  window.addEventListener("stay-updated", async () => {
    refreshUi();
    if (localStorage.getItem("housePushEnabled") === "true" && currentFid) {
      try {
        const user = await ensureAnonymousUser(auth, authSdk);
        await saveRegistration({ user, installationId: currentFid, db, firestoreSdk });
      } catch (error) {
        console.warn("Could not sync changed departure date", error);
      }
    }
  });

  refreshUi();

  // Bereits aktivierte Geräte bei jedem App-Start frisch registrieren.
  if (localStorage.getItem("housePushEnabled") === "true" && Notification.permission === "granted") {
    const departure = localStorage.getItem("houseDepartureDate");
    if (departure) {
      try {
        await ensureAnonymousUser(auth, authSdk);
        const swRegistration = await navigator.serviceWorker.ready;
        await messagingSdk.register(messaging, {
          vapidKey: pushSettings.vapidKey,
          serviceWorkerRegistration: swRegistration
        });
      } catch (error) {
        console.warn("Could not refresh push registration", error);
      }
    }
  }

  async function enablePush() {
    const departure = localStorage.getItem("houseDepartureDate");
    if (!departure) {
      setStatus("Bitte zuerst oben das Abreisedatum speichern. Danach können Erinnerungen aktiviert werden.", "info");
      return;
    }

    notificationButton.disabled = true;
    setStatus("Benachrichtigungen werden aktiviert …", "info");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Benachrichtigungen wurden im Browser nicht erlaubt.", "error");
        return;
      }

      await ensureAnonymousUser(auth, authSdk);
      const swRegistration = await navigator.serviceWorker.ready;
      await messagingSdk.register(messaging, {
        vapidKey: pushSettings.vapidKey,
        serviceWorkerRegistration: swRegistration
      });

      // Der endgültige Status wird nach onRegistered gesetzt.
      setStatus("Gerät wird registriert …", "info");
    } catch (error) {
      console.error("Could not enable push", error);
      setStatus("Benachrichtigungen konnten nicht aktiviert werden.", "error");
    } finally {
      notificationButton.disabled = false;
    }
  }

  async function disablePush() {
    notificationButton.disabled = true;
    try {
      const user = auth.currentUser;
      if (user) {
        await firestoreSdk.deleteDoc(firestoreSdk.doc(db, "reminderRegistrations", user.uid));
      }
      await messagingSdk.unregister(messaging);
      currentFid = null;
      localStorage.removeItem("housePushEnabled");
      refreshUi();
    } catch (error) {
      console.error("Could not disable push", error);
      setStatus("Benachrichtigungen konnten nicht vollständig deaktiviert werden.", "error");
    } finally {
      notificationButton.disabled = false;
    }
  }

  function refreshUi() {
    const departure = localStorage.getItem("houseDepartureDate");
    const enabled = localStorage.getItem("housePushEnabled") === "true" && Notification.permission === "granted";

    if (enabled) {
      notificationButton.textContent = "Benachrichtigungen deaktivieren";
      notificationButton.classList.add("secondary-btn");
      notificationButton.classList.remove("primary-btn");
      setStatus(`Aktiv · Müll am Vorabend gegen 18:15 Uhr${departure ? ` · Abreise am ${formatDate(departure)}` : ""}.`, "ok");
    } else {
      notificationButton.textContent = "🔔 Benachrichtigungen aktivieren";
      notificationButton.classList.add("primary-btn");
      notificationButton.classList.remove("secondary-btn");
      if (!departure) {
        setStatus("Für Abreise-Erinnerungen zuerst das Abreisedatum speichern.", "info");
      } else if (Notification.permission === "denied") {
        setStatus("Benachrichtigungen sind im Browser blockiert. Bitte in den Website-/App-Einstellungen erlauben.", "error");
      } else {
        setStatus("Optional: Müll- und Abreise-Erinnerungen direkt aufs Handy bekommen.", "info");
      }
    }
  }
}

async function ensureAnonymousUser(auth, authSdk) {
  if (auth.currentUser) return auth.currentUser;
  const credential = await authSdk.signInAnonymously(auth);
  return credential.user;
}

async function saveRegistration({ user, installationId, db, firestoreSdk }) {
  const departureDate = localStorage.getItem("houseDepartureDate") || "";
  await firestoreSdk.setDoc(
    firestoreSdk.doc(db, "reminderRegistrations", user.uid),
    {
      installationId,
      enabled: true,
      departureDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris",
      locale: navigator.language || "de-DE",
      lastSeenAt: firestoreSdk.serverTimestamp()
    },
    { merge: true }
  );
}

function setStatus(message, kind = "info") {
  if (!notificationStatus) return;
  notificationStatus.textContent = message;
  notificationStatus.dataset.kind = kind;
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
