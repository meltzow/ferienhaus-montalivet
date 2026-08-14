const pushSettings = globalThis.FIREBASE_PUSH;
const notificationCard = document.getElementById("notification-card");
const notificationButton = document.getElementById("notification-btn");
const notificationStatus = document.getElementById("notification-status");

if (!notificationCard || !notificationButton || !notificationStatus) {
  console.warn("Push UI not found.");
} else if (!pushSettings?.enabled) {
  notificationCard.hidden = true;
} else {
  notificationCard.hidden = false;
  initPush().catch(error => {
    console.error("Push initialization failed", error);
    setStatus(`Initialisierung fehlgeschlagen: ${describeError(error)}`, "error");
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
  let messagingWorkerRegistration = null;

  // Wenn die PWA im Vordergrund geöffnet ist, kommt die Nachricht über onMessage.
  messagingSdk.onMessage(messaging, async payload => {
    const notification = payload.notification || {};
    const data = payload.data || {};
    const title = notification.title || data.title || "Ferienhaus Montalivet";
    const body = notification.body || data.body || "Es gibt eine neue Erinnerung.";

    try {
      const swRegistration = await navigator.serviceWorker.ready;
      await swRegistration.showNotification(title, {
        body,
        icon: "./icon.svg",
        badge: "./icon.svg",
        tag: data.tag || "ferienhaus-reminder",
        renotify: true,
        data: {
          url: data.url || "https://meltzow.github.io/ferienhaus-montalivet/#departure"
        }
      });
    } catch (error) {
      console.error("Foreground notification could not be shown", error);
      setStatus(`Push empfangen, Anzeige fehlgeschlagen: ${describeError(error)}`, "error");
    }
  });

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
      setStatus(`Gerät ist bei FCM registriert, Speichern fehlgeschlagen: ${describeError(error)}`, "error");
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
  // Den Worker explizit übergeben: Die App liegt auf GitHub Pages in einem
  // Unterverzeichnis, während Firebase sonst am Domain-Root suchen würde.
  if (localStorage.getItem("housePushEnabled") === "true" && Notification.permission === "granted") {
    const departure = localStorage.getItem("houseDepartureDate");
    if (departure) {
      try {
        await ensureAnonymousUser(auth, authSdk);
        const serviceWorkerRegistration = await getMessagingWorkerRegistration();
        await messagingSdk.register(messaging, {
          vapidKey: pushSettings.vapidKey,
          serviceWorkerRegistration
        });
      } catch (error) {
        console.warn("Could not refresh push registration", error);
        setStatus(`Erinnerungen konnten nicht aktualisiert werden: ${describeError(error)}`, "error");
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

    try {
      setStatus("1/4 Benachrichtigungsfreigabe wird geprüft …", "info");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Benachrichtigungen wurden im Browser nicht erlaubt.", "error");
        return;
      }

      setStatus("2/4 Anonyme Geräte-Anmeldung bei Firebase …", "info");
      await ensureAnonymousUser(auth, authSdk);

      setStatus("3/4 Firebase-Messaging-Service-Worker wird vorbereitet …", "info");
      const serviceWorkerRegistration = await getMessagingWorkerRegistration();

      setStatus("4/4 Gerät wird bei Firebase Cloud Messaging registriert …", "info");
      await messagingSdk.register(messaging, {
        vapidKey: pushSettings.vapidKey,
        serviceWorkerRegistration
      });

      setStatus("Gerät wurde bei FCM registriert. Registrierung wird gespeichert …", "info");
    } catch (error) {
      console.error("Could not enable push", error);
      setStatus(`Aktivierung fehlgeschlagen: ${describeError(error)}`, "error");
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
      setStatus(`Deaktivieren fehlgeschlagen: ${describeError(error)}`, "error");
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

  async function getMessagingWorkerRegistration() {
    if (messagingWorkerRegistration) return messagingWorkerRegistration;

    messagingWorkerRegistration = await navigator.serviceWorker.register(
      "./firebase-messaging-sw.js?v=2.1",
      { scope: "./firebase-cloud-messaging-push-scope/" }
    );

    await waitForActiveWorker(messagingWorkerRegistration);
    return messagingWorkerRegistration;
  }
}

function waitForActiveWorker(registration) {
  if (registration.active) return Promise.resolve();

  const worker = registration.installing || registration.waiting;
  if (!worker) {
    return Promise.reject(new Error("Der Firebase-Messaging-Service-Worker ist nicht aktiv."));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Der Firebase-Messaging-Service-Worker wurde nicht rechtzeitig aktiv."));
    }, 10000);

    const handleStateChange = () => {
      if (worker.state === "activated") {
        clearTimeout(timeout);
        worker.removeEventListener("statechange", handleStateChange);
        resolve();
      } else if (worker.state === "redundant") {
        clearTimeout(timeout);
        worker.removeEventListener("statechange", handleStateChange);
        reject(new Error("Der Firebase-Messaging-Service-Worker konnte nicht aktiviert werden."));
      }
    };

    worker.addEventListener("statechange", handleStateChange);
    handleStateChange();
  });
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

function describeError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || error || "Unbekannter Fehler")
    .replace(/^Firebase:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (code === "auth/operation-not-allowed") {
    return `${code} – Anonyme Anmeldung ist in Firebase noch nicht aktiviert.`;
  }
  if (code === "auth/unauthorized-domain") {
    return `${code} – meltzow.github.io muss in Firebase Authentication als autorisierte Domain eingetragen werden.`;
  }
  if (code === "messaging/failed-service-worker-registration") {
    return `${code} – der Firebase-Messaging-Service-Worker konnte nicht registriert werden.`;
  }
  if (code === "messaging/unsupported-browser") {
    return `${code} – dieser Browser unterstützt Firebase Web Push nicht.`;
  }
  if (code.includes("subscribe") || code.includes("registration")) {
    return `${code || "FCM"} – ${message}. Falls die Meldung die FCM Registration API erwähnt, muss sie im Google-Cloud-Projekt aktiviert werden.`;
  }
  return code ? `${code} – ${message}` : message;
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
