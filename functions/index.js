import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

const TIME_ZONE = "Europe/Paris";
const WASTE_SCHEDULE_YEAR = 2026;
const APP_URL = "https://meltzow.github.io/ferienhaus-montalivet/";

export const sendGuestReminders = onSchedule(
  {
    schedule: "15 18 * * *",
    timeZone: TIME_ZONE,
    region: "europe-west1"
  },
  async () => {
    const db = getFirestore();
    const today = dateStringInZone(new Date(), TIME_ZONE);
    const tomorrow = addDays(today, 1);
    const todayWeekday = weekday(today);
    const tomorrowYear = Number(tomorrow.slice(0, 4));
    const tomorrowMonth = Number(tomorrow.slice(5, 7));

    const snapshot = await db.collection("reminderRegistrations").where("enabled", "==", true).get();

    for (const doc of snapshot.docs) {
      const registration = doc.data();
      const departureDate = registration.departureDate || "";

      // Nach dem Aufenthalt automatisch aufräumen, damit ehemalige Gäste
      // keine weiteren Müll-Erinnerungen bekommen.
      if (!departureDate || departureDate <= today) {
        await doc.ref.delete();
        continue;
      }

      const reminders = [];

      if (tomorrowYear === WASTE_SCHEDULE_YEAR) {
        // Dienstagabend: gelbe + grüne Tonne für Mittwochmorgen.
        if (todayWeekday === 2) {
          reminders.push({
            type: "waste-yellow-green",
            text: "Morgen früh: gelbe und grüne Tonne. Bitte heute Abend rausstellen."
          });
        }

        // Mittwochabend: schwarze Tonne für Donnerstagmorgen.
        if (todayWeekday === 3) {
          const summerMontalivet = tomorrowMonth === 7 || tomorrowMonth === 8;
          const residualWasteWeek = summerMontalivet || isoWeek(tomorrow) % 2 === 1;
          if (residualWasteWeek) {
            reminders.push({
              type: "waste-black",
              text: "Morgen früh: Restmüll. Bitte heute Abend die schwarze Tonne rausstellen."
            });
          }
        }
      }

      if (departureDate === tomorrow) {
        reminders.push({
          type: "departure",
          text: "Ihr reist morgen ab. Bitte die Abreise-Checkliste ansehen."
        });
      }

      if (reminders.length === 0) continue;

      const reminderKey = `${today}:${reminders.map(item => item.type).sort().join("+")}`;
      if (registration.lastReminderKey === reminderKey) continue;

      const hasDeparture = reminders.some(item => item.type === "departure");
      const hasWaste = reminders.some(item => item.type.startsWith("waste-"));
      const title = hasDeparture && hasWaste
        ? "Morgen wichtig im Ferienhaus"
        : hasDeparture
          ? "Abreise morgen"
          : "Müll morgen";

      try {
        await getMessaging().send({
          fid: registration.installationId,
          notification: {
            title,
            body: reminders.map(item => item.text).join(" ")
          },
          webpush: {
            fcmOptions: {
              link: hasDeparture ? `${APP_URL}#departure` : APP_URL
            }
          }
        });

        await doc.ref.update({
          lastReminderKey: reminderKey,
          lastReminderAt: FieldValue.serverTimestamp()
        });
      } catch (error) {
        const code = error?.code || "";
        console.error("Push failed", { registrationId: doc.id, code, message: error?.message });

        if (code.includes("installation-id-not-registered") || code.includes("registration-token-not-registered")) {
          await doc.ref.delete();
        }
      }
    }
  }
);

function dateStringInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function weekday(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isoWeek(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNumber = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}
