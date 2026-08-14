import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { buildWasteReminders } from "./reminder-logic.mjs";

const TIME_ZONE = "Europe/Paris";
const WASTE_SCHEDULE_YEAR = 2026;
const APP_URL = "https://meltzow.github.io/ferienhaus-montalivet/";
const MODE = process.env.REMINDER_MODE || "scheduled";

const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!rawCredentials) {
  console.log("FIREBASE_SERVICE_ACCOUNT ist noch nicht als GitHub Secret hinterlegt – Erinnerungen werden übersprungen.");
  process.exit(0);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(rawCredentials);
} catch (error) {
  console.error("FIREBASE_SERVICE_ACCOUNT enthält kein gültiges JSON.");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id || "ferienhaus-montalivet"
});

const db = getFirestore();
const messaging = getMessaging();
const today = dateStringInZone(new Date(), TIME_ZONE);
const tomorrow = addDays(today, 1);
const todayWeekday = weekday(today);
const tomorrowYear = Number(tomorrow.slice(0, 4));
const tomorrowMonth = Number(tomorrow.slice(5, 7));
const wasteOverrideSnapshot = await db.collection("wastePickups").doc(tomorrow).get();
const wasteOverride = wasteOverrideSnapshot.exists ? wasteOverrideSnapshot.data() : null;

if (wasteOverride) {
  console.log(`Manuelle Müllplan-Überschreibung für ${tomorrow} gefunden (${wasteOverride.enabled ? "aktiv" : "deaktiviert"}).`);
}

const snapshot = await db
  .collection("reminderRegistrations")
  .where("enabled", "==", true)
  .get();

console.log(`${snapshot.size} aktive Registrierung(en) gefunden. Modus: ${MODE}.`);

for (const doc of snapshot.docs) {
  const registration = doc.data();
  const installationId = registration.installationId;
  const departureDate = registration.departureDate || "";

  if (!installationId) {
    console.log(`Registrierung ${doc.id} ohne FID wird gelöscht.`);
    await doc.ref.delete();
    continue;
  }

  // Nach dem Aufenthalt keine Müll-Erinnerungen mehr senden.
  if (MODE !== "test" && (!departureDate || departureDate <= today)) {
    await doc.ref.delete();
    console.log(`Abgelaufene Registrierung ${doc.id} gelöscht.`);
    continue;
  }

  if (MODE === "test") {
    await sendNotification({
      doc,
      installationId,
      title: "Test: Ferienhaus-Erinnerungen",
      body: "Push funktioniert. Müll- und Abreise-Erinnerungen können dieses Gerät erreichen.",
      reminderKey: `test:${today}:${Date.now()}`,
      markAsReminder: false
    });
    continue;
  }

  const reminders = buildWasteReminders({
    wasteOverride,
    tomorrow,
    todayWeekday,
    tomorrowYear,
    tomorrowMonth,
    wasteScheduleYear: WASTE_SCHEDULE_YEAR
  });

  if (departureDate === tomorrow) {
    reminders.push({
      type: "departure",
      text: "Ihr reist morgen ab. Bitte die Abreise-Checkliste ansehen."
    });
  }

  if (reminders.length === 0) continue;

  const reminderKey = `${today}:${reminders.map(item => item.type).sort().join("+")}`;
  if (registration.lastReminderKey === reminderKey) {
    console.log(`Erinnerung ${reminderKey} für ${doc.id} wurde bereits gesendet.`);
    continue;
  }

  const hasDeparture = reminders.some(item => item.type === "departure");
  const hasWaste = reminders.some(item => item.type.startsWith("waste-"));
  const wasteTitle = reminders.find(item => item.type.startsWith("waste-"))?.title;
  const title = hasDeparture && hasWaste
    ? "Morgen wichtig im Ferienhaus"
    : hasDeparture
      ? "Abreise morgen"
      : wasteTitle || "Müll morgen";

  await sendNotification({
    doc,
    installationId,
    title,
    body: reminders.map(item => item.text).join(" "),
    reminderKey,
    markAsReminder: true
  });
}

async function sendNotification({ doc, installationId, title, body, reminderKey, markAsReminder }) {
  try {
    const response = await messaging.send({
      fid: installationId,
      notification: { title, body },
      webpush: {
        fcmOptions: { link: APP_URL },
        notification: {
          icon: `${APP_URL}icon.svg`,
          badge: `${APP_URL}icon.svg`,
          tag: `ferienhaus-${reminderKey}`,
          renotify: true
        }
      }
    });

    console.log(`Push an ${doc.id} gesendet: ${response}`);

    if (markAsReminder) {
      await doc.ref.set({
        lastReminderKey: reminderKey,
        lastReminderAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    const code = error?.code || "";
    console.error(`Push an ${doc.id} fehlgeschlagen: ${code || error.message}`);

    if (
      code === "messaging/installation-id-not-registered" ||
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    ) {
      await doc.ref.delete();
      console.log(`Ungültige Registrierung ${doc.id} wurde entfernt.`);
    }
  }
}

function dateStringInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(isoDate, amount) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function weekday(isoDate) {
  return new Date(`${isoDate}T12:00:00Z`).getUTCDay();
}
