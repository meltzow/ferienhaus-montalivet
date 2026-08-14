# Ferienhaus Montalivet

Mobile Web-App / PWA für Gäste des Ferienhauses, gehostet über GitHub Pages.

## Enthalten

- mobile Startseite mit Schnellzugriff
- Inhalte aus dem Hausbuch
- offiziell geprüfter Müllplan 2026 für Montalivet
- automatische Hinweise auf der Startseite
- Abreisedatum auf dem Gastgerät
- abhakbare Abreise-Checkliste
- Frage/Problem per vorbereiteter WhatsApp-Nachricht
- PWA / "Zum Startbildschirm hinzufügen"
- Offline-Cache für die Kernseiten
- Stand/Alter pro Themenbereich
- aktive Push-Erinnerungen für Müll und Abreise
- geschützte Admin-Seite zur Inhaltspflege ohne GitHub-Konto

## Phase 2a – kostenlos

Die Push-Architektur benötigt keinen Firebase-Blaze-Tarif:

- GitHub Pages: Frontend/PWA
- Firebase Spark: Anonymous Authentication + Firestore + Cloud Messaging
- GitHub Actions: täglicher Scheduler um 18:15 Uhr Europe/Paris

Die vollständige Einrichtung steht in [`SETUP_PUSH.md`](SETUP_PUSH.md).

## Verwaltung ohne GitHub-Konto

Unter `admin.html` können freigeschaltete Verwalter Hausinformationen,
WhatsApp-Kontakt, Abreise-Checkliste und datumsbezogene Müllplan-Überschreibungen
bearbeiten. Die Anmeldung läuft über Firebase Authentication; die Inhalte werden
in Firestore veröffentlicht.

Die einmalige Einrichtung steht in [`SETUP_ADMIN.md`](SETUP_ADMIN.md).

## Push-Erinnerungen

Nach der einmaligen Einrichtung kann ein Gast:

1. Abreisedatum speichern.
2. Benachrichtigungen aktivieren.
3. Müll-Erinnerungen am Vorabend erhalten.
4. Am Tag vor der Abreise zur Checkliste erinnert werden.

Die aktive Registrierung wird nach dem Aufenthalt automatisch entfernt.

## WhatsApp

In `house-data.js` bei `ownerWhatsApp` die Zielnummer eintragen, Format z. B.:

```js
ownerWhatsApp: "491701234567"
```

ohne `+`, Leerzeichen oder führende `0`.

## Wichtige Dateien

- `index.html` – Oberfläche
- `styles.css` – Design
- `house-data.js` – Hausinhalte, Versions- und Aktualitätsangaben
- `app.js` – lokale App-Logik
- `push.js` – Push-Registrierung im Browser
- `content-client.js` – Laden veröffentlichter Inhalte mit lokalem Rückfall
- `admin.html` / `admin.js` – geschützte Verwaltung
- `firebase-config.js` – öffentliche Firebase-Web-Konfiguration
- `firestore.rules` – Zugriffsschutz für Gastregistrierungen
- `scripts/send-reminders.mjs` – Reminder-Logik auf GitHub Actions
- `.github/workflows/reminders.yml` – täglicher kostenloser Scheduler
- `.github/workflows/deploy-firestore-rules.yml` – einmaliger Rules-Deploy
- `sw.js` – PWA-Service-Worker und FCM-Hintergrundempfang
- `assets/source/` – Originalfotos aus dem Hausbuch

## Jahreswechsel

Der Müllplan ist auf 2026 begrenzt. Vor 2027 müssen die offiziellen Abholtermine erneut geprüft und sowohl die App-Daten als auch `WASTE_SCHEDULE_YEAR` in `scripts/send-reminders.mjs` aktualisiert werden.
