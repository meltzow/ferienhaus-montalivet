const settings = globalThis.FIREBASE_PUSH;
const loadingSection = document.getElementById("admin-loading");
const loginSection = document.getElementById("admin-login");
const forbiddenSection = document.getElementById("admin-forbidden");
const editor = document.getElementById("admin-editor");
const loginStatus = document.getElementById("login-status");
const saveStatus = document.getElementById("save-status");
const wasteStatus = document.getElementById("waste-status");

if (!settings?.enabled) {
  loadingSection.innerHTML = "<h2>Firebase ist noch nicht aktiviert.</h2><p>Die Verwaltung benötigt die Firebase-Konfiguration.</p>";
} else {
  initAdmin().catch(error => {
    console.error("Admin initialization failed", error);
    loadingSection.innerHTML = `<h2>Verwaltung konnte nicht geladen werden.</h2><p>${escapeHtml(describeError(error))}</p>`;
  });
}

async function initAdmin() {
  const version = settings.sdkVersion || "12.16.0";
  const base = `https://www.gstatic.com/firebasejs/${version}`;
  const [appSdk, authSdk, firestoreSdk] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`)
  ]);

  const app = appSdk.getApps().find(candidate => candidate.name === "admin-console")
    || appSdk.initializeApp(settings.config, "admin-console");
  const auth = authSdk.getAuth(app);
  await authSdk.setPersistence(auth, authSdk.browserSessionPersistence);
  const db = firestoreSdk.getFirestore(app);
  let editableContent = structuredClone(window.HOUSE_DATA);
  let wasteEntries = [];

  document.getElementById("login-form").addEventListener("submit", async event => {
    event.preventDefault();
    setMessage(loginStatus, "Anmeldung wird geprüft …", "info");
    const button = event.submitter || event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await authSdk.signInWithEmailAndPassword(
        auth,
        document.getElementById("admin-email").value.trim(),
        document.getElementById("admin-password").value
      );
      document.getElementById("admin-password").value = "";
    } catch (error) {
      setMessage(loginStatus, describeError(error), "error");
    } finally {
      button.disabled = false;
    }
  });

  const logout = () => authSdk.signOut(auth);
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("forbidden-logout").addEventListener("click", logout);

  document.getElementById("content-form").addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.getElementById("save-content");
    button.disabled = true;
    setMessage(saveStatus, "Änderungen werden veröffentlicht …", "info");

    try {
      editableContent = collectContentFromForm(editableContent);
      const publishedContent = {
        houseName: editableContent.houseName,
        ownerWhatsApp: editableContent.ownerWhatsApp,
        wasteScheduleYear: editableContent.wasteScheduleYear,
        topics: editableContent.topics,
        departureChecklist: editableContent.departureChecklist,
        departureUpdatedAt: currentMonthYear(),
        lastUpdated: new Date().toLocaleDateString("de-DE"),
        schemaVersion: 1,
        updatedAt: firestoreSdk.serverTimestamp(),
        updatedBy: auth.currentUser.uid
      };

      await firestoreSdk.setDoc(
        firestoreSdk.doc(db, "houseContent", "main"),
        publishedContent
      );
      localStorage.removeItem("housePublishedContentV1");
      setMessage(saveStatus, `Veröffentlicht am ${new Date().toLocaleString("de-DE")}.`, "ok");
    } catch (error) {
      console.error("Could not save content", error);
      setMessage(saveStatus, describeError(error), "error");
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById("waste-form").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.submitter || event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    setMessage(wasteStatus, "Termin wird gespeichert …", "info");

    try {
      const date = document.getElementById("waste-date").value;
      await firestoreSdk.setDoc(firestoreSdk.doc(db, "wastePickups", date), {
        date,
        label: document.getElementById("waste-label").value.trim(),
        message: document.getElementById("waste-message").value.trim(),
        enabled: document.getElementById("waste-enabled").checked,
        updatedAt: firestoreSdk.serverTimestamp(),
        updatedBy: auth.currentUser.uid
      });
      resetWasteForm();
      await loadWasteEntries();
      setMessage(wasteStatus, "Mülltermin gespeichert.", "ok");
    } catch (error) {
      console.error("Could not save waste pickup", error);
      setMessage(wasteStatus, describeError(error), "error");
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById("waste-reset").addEventListener("click", resetWasteForm);

  authSdk.onAuthStateChanged(auth, async user => {
    loadingSection.hidden = false;
    loginSection.hidden = true;
    forbiddenSection.hidden = true;
    editor.hidden = true;

    if (!user) {
      loadingSection.hidden = true;
      loginSection.hidden = false;
      return;
    }

    try {
      const adminSnapshot = await firestoreSdk.getDoc(firestoreSdk.doc(db, "admins", user.uid));
      if (!adminSnapshot.exists() || adminSnapshot.data().active !== true) {
        loadingSection.hidden = true;
        forbiddenSection.hidden = false;
        return;
      }

      document.getElementById("admin-user").textContent = user.email || "Admin";
      const contentSnapshot = await firestoreSdk.getDoc(firestoreSdk.doc(db, "houseContent", "main"));
      if (contentSnapshot.exists()) {
        editableContent = mergeEditableContent(window.HOUSE_DATA, contentSnapshot.data());
        setMessage(saveStatus, "Veröffentlichte Inhalte geladen.", "ok");
      } else {
        editableContent = structuredClone(window.HOUSE_DATA);
        setMessage(saveStatus, "Grunddaten aus der App geladen. Beim ersten Speichern werden sie in Firestore veröffentlicht.", "info");
      }

      renderContentForm(editableContent);
      await loadWasteEntries();
      loadingSection.hidden = true;
      editor.hidden = false;
    } catch (error) {
      console.error("Could not verify admin", error);
      loadingSection.innerHTML = `<h2>Zugriff konnte nicht geprüft werden.</h2><p>${escapeHtml(describeError(error))}</p>`;
    }
  });

  async function loadWasteEntries() {
    const snapshot = await firestoreSdk.getDocs(
      firestoreSdk.query(
        firestoreSdk.collection(db, "wastePickups"),
        firestoreSdk.orderBy("date", "asc")
      )
    );
    wasteEntries = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    renderWasteEntries();
  }

  function renderWasteEntries() {
    const list = document.getElementById("waste-list");
    list.innerHTML = "";

    if (wasteEntries.length === 0) {
      list.innerHTML = '<p class="muted">Noch keine manuellen Überschreibungen vorhanden. Der eingebaute Müllplan bleibt aktiv.</p>';
      return;
    }

    for (const entry of wasteEntries) {
      const row = document.createElement("article");
      row.className = "admin-waste-row";
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(formatDate(entry.date))} · ${escapeHtml(entry.label || "Müllabholung")}</strong>
          <p>${escapeHtml(entry.message || "")}</p>
          <span class="small ${entry.enabled ? "admin-active" : "muted"}">${entry.enabled ? "Aktiv" : "Deaktiviert – eingebauter Termin wird unterdrückt"}</span>
        </div>
        <div class="admin-inline-actions">
          <button class="secondary-btn" type="button" data-edit-waste="${escapeHtml(entry.id)}">Bearbeiten</button>
          <button class="text-btn admin-delete" type="button" data-delete-waste="${escapeHtml(entry.id)}">Löschen</button>
        </div>
      `;
      list.appendChild(row);
    }

    list.querySelectorAll("[data-edit-waste]").forEach(button => {
      button.addEventListener("click", () => editWasteEntry(button.dataset.editWaste));
    });
    list.querySelectorAll("[data-delete-waste]").forEach(button => {
      button.addEventListener("click", () => deleteWasteEntry(button.dataset.deleteWaste));
    });
  }

  function editWasteEntry(id) {
    const entry = wasteEntries.find(item => item.id === id);
    if (!entry) return;
    document.getElementById("waste-date").value = entry.date || id;
    document.getElementById("waste-label").value = entry.label || "";
    document.getElementById("waste-message").value = entry.message || "";
    document.getElementById("waste-enabled").checked = entry.enabled === true;
    document.getElementById("waste-date").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function deleteWasteEntry(id) {
    if (!confirm("Diese Überschreibung löschen? Danach gilt für das Datum wieder der eingebaute Müllplan.")) return;
    try {
      await firestoreSdk.deleteDoc(firestoreSdk.doc(db, "wastePickups", id));
      await loadWasteEntries();
      setMessage(wasteStatus, "Überschreibung gelöscht. Der eingebaute Müllplan gilt wieder.", "ok");
    } catch (error) {
      setMessage(wasteStatus, describeError(error), "error");
    }
  }
}

function renderContentForm(content) {
  document.getElementById("content-house-name").value = content.houseName || "";
  document.getElementById("content-whatsapp").value = content.ownerWhatsApp || "";
  document.getElementById("content-checklist").value = (content.departureChecklist || []).join("\n");

  const topicEditor = document.getElementById("topic-editor");
  topicEditor.innerHTML = "";
  for (const [index, topic] of (content.topics || []).entries()) {
    const details = document.createElement("details");
    details.className = "admin-topic";
    details.dataset.topicIndex = String(index);
    details.innerHTML = `
      <summary><span>${escapeHtml(topic.icon || "📄")}</span> ${escapeHtml(topic.title || "Thema")}</summary>
      <div class="admin-topic__body">
        <div class="admin-field-grid">
          <label><span>Titel</span><input type="text" data-field="title" value="${escapeHtml(topic.title || "")}" required></label>
          <label><span>Kurzbeschreibung</span><input type="text" data-field="teaser" value="${escapeHtml(topic.teaser || "")}" required></label>
        </div>
        <label><span>Kleine Überschrift</span><input type="text" data-field="eyebrow" value="${escapeHtml(topic.eyebrow || "")}"></label>
        <label><span>Hinweisbox</span><textarea data-field="callout" rows="3">${escapeHtml(topic.callout || "")}</textarea></label>
        <label><span>Inhalte – ein Punkt pro Zeile</span><textarea data-field="items" rows="8" required>${escapeHtml((topic.items || []).join("\n"))}</textarea></label>
      </div>
    `;
    topicEditor.appendChild(details);
  }
}

function collectContentFromForm(previous) {
  const next = structuredClone(previous);
  next.houseName = document.getElementById("content-house-name").value.trim();
  next.ownerWhatsApp = document.getElementById("content-whatsapp").value.replace(/\D/g, "");
  next.departureChecklist = linesFrom(document.getElementById("content-checklist").value);

  document.querySelectorAll(".admin-topic").forEach(details => {
    const index = Number(details.dataset.topicIndex);
    const topic = next.topics[index];
    topic.title = details.querySelector('[data-field="title"]').value.trim();
    topic.teaser = details.querySelector('[data-field="teaser"]').value.trim();
    topic.eyebrow = details.querySelector('[data-field="eyebrow"]').value.trim();
    topic.callout = details.querySelector('[data-field="callout"]').value.trim();
    topic.items = linesFrom(details.querySelector('[data-field="items"]').value);
    topic.updatedAt = currentMonthYear();
  });

  return next;
}

function mergeEditableContent(fallback, remote) {
  const merged = structuredClone(fallback);
  for (const key of ["houseName", "ownerWhatsApp", "wasteScheduleYear", "topics", "departureChecklist", "departureUpdatedAt", "lastUpdated"]) {
    if (remote[key] !== undefined) merged[key] = remote[key];
  }
  return merged;
}

function resetWasteForm() {
  document.getElementById("waste-form").reset();
  document.getElementById("waste-enabled").checked = true;
}

function linesFrom(value) {
  return value.split("\n").map(line => line.trim()).filter(Boolean);
}

function setMessage(element, message, kind) {
  element.textContent = message;
  element.dataset.kind = kind;
}

function currentMonthYear() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getFullYear()).slice(-2)}`;
}

function formatDate(isoDate) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString("de-DE");
}

function describeError(error) {
  const code = String(error?.code || "");
  if (code === "auth/invalid-credential") return "E-Mail-Adresse oder Passwort ist nicht korrekt.";
  if (code === "auth/too-many-requests") return "Zu viele Anmeldeversuche. Bitte später erneut versuchen.";
  if (code === "auth/operation-not-allowed") return "Die E-Mail/Passwort-Anmeldung ist in Firebase noch nicht aktiviert.";
  if (code === "permission-denied" || code === "firestore/permission-denied") return "Keine Berechtigung. Bitte Admin-Freischaltung und Firestore-Regeln prüfen.";
  const message = String(error?.message || error || "Unbekannter Fehler").replace(/^Firebase:\s*/i, "");
  return code ? `${code} – ${message}` : message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
