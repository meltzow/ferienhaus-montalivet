const CONTENT_CACHE_KEY = "housePublishedContentV1";
const WASTE_CACHE_KEY = "houseWasteOverridesV1";

export async function loadPublishedData(fallback) {
  const cachedContent = readJson(CONTENT_CACHE_KEY, {});
  const cachedWaste = readJson(WASTE_CACHE_KEY, {});
  const initial = {
    content: mergeContent(fallback, cachedContent),
    wastePickups: cachedWaste
  };

  if (!globalThis.FIREBASE_PUSH?.enabled) return initial;

  try {
    return await Promise.race([
      loadRemoteData(fallback, cachedContent, cachedWaste),
      timeoutAfter(1200, initial)
    ]);
  } catch (error) {
    console.warn("Veröffentlichte Inhalte konnten nicht geladen werden.", error);
    return initial;
  }
}

async function loadRemoteData(fallback, cachedContent, cachedWaste) {
  const settings = globalThis.FIREBASE_PUSH;
  const version = settings.sdkVersion || "12.16.0";
  const base = `https://www.gstatic.com/firebasejs/${version}`;
  const [appSdk, firestoreSdk] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-firestore.js`)
  ]);

  const app = appSdk.getApps().length
    ? appSdk.getApp()
    : appSdk.initializeApp(settings.config);
  const db = firestoreSdk.getFirestore(app);
  const today = localDateString(new Date());
  const tomorrow = addDays(today, 1);

  const [contentSnapshot, todaySnapshot, tomorrowSnapshot] = await Promise.all([
    firestoreSdk.getDoc(firestoreSdk.doc(db, "houseContent", "main")),
    firestoreSdk.getDoc(firestoreSdk.doc(db, "wastePickups", today)),
    firestoreSdk.getDoc(firestoreSdk.doc(db, "wastePickups", tomorrow))
  ]);

  let content = cachedContent;
  if (contentSnapshot.exists()) {
    content = normalizeContent(contentSnapshot.data());
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(content));
  }

  const wastePickups = { ...cachedWaste };
  updateWasteCache(wastePickups, today, todaySnapshot);
  updateWasteCache(wastePickups, tomorrow, tomorrowSnapshot);
  localStorage.setItem(WASTE_CACHE_KEY, JSON.stringify(wastePickups));

  return {
    content: mergeContent(fallback, content),
    wastePickups
  };
}

function normalizeContent(value) {
  const content = {};
  if (typeof value.houseName === "string") content.houseName = value.houseName;
  if (typeof value.ownerWhatsApp === "string") content.ownerWhatsApp = value.ownerWhatsApp;
  if (typeof value.lastUpdated === "string") content.lastUpdated = value.lastUpdated;
  if (typeof value.departureUpdatedAt === "string") content.departureUpdatedAt = value.departureUpdatedAt;
  if (Number.isInteger(value.wasteScheduleYear)) content.wasteScheduleYear = value.wasteScheduleYear;
  if (Array.isArray(value.topics)) content.topics = value.topics;
  if (Array.isArray(value.departureChecklist)) content.departureChecklist = value.departureChecklist;
  return content;
}

function mergeContent(fallback, override) {
  return {
    ...fallback,
    ...normalizeContent(override),
    siteVersion: fallback.siteVersion,
    sourceImages: fallback.sourceImages
  };
}

function updateWasteCache(cache, date, snapshot) {
  if (!snapshot.exists()) {
    delete cache[date];
    return;
  }

  const value = snapshot.data();
  cache[date] = {
    date,
    label: typeof value.label === "string" ? value.label : "Müllabholung",
    message: typeof value.message === "string" ? value.message : "Bitte heute Abend die Tonnen rausstellen.",
    enabled: value.enabled === true
  };
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "") || fallback;
  } catch {
    return fallback;
  }
}

function timeoutAfter(milliseconds, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), milliseconds));
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(isoDate, amount) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day + amount);
  return localDateString(date);
}
