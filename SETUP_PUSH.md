# Phase 2a – Push kostenlos mit GitHub Actions

Die Erinnerungen laufen ohne Firebase Cloud Functions und ohne Blaze-Tarif.

## Architektur

- **GitHub Pages** bleibt die Web-App / PWA.
- **Firebase Authentication (Anonymous)** meldet jedes Gastgerät anonym an.
- **Cloud Firestore (Spark / kostenlos)** speichert die aktive Geräte-Registrierung und das Abreisedatum.
- **Firebase Cloud Messaging (FCM)** liefert Web-Push.
- **GitHub Actions** ersetzt den kostenpflichtigen Scheduler und läuft täglich um 18:15 Uhr `Europe/Paris`.

Geprüft werden:

- Dienstagabend: gelbe + grüne Tonne für Mittwochmorgen
- Mittwochabend: schwarze Tonne für Donnerstagmorgen nach Müllplan 2026
- Abend vor der Abreise: Link zur Abreise-Checkliste
- abgelaufene Aufenthalte: Registrierung wird automatisch gelöscht

## Was bereits eingerichtet ist

- Firebase-Web-App ist in `firebase-config.js` eingetragen.
- Öffentlicher VAPID-Key ist eingetragen.
- Anonymous Authentication und Firestore sind im Firebase-Projekt aktiviert.
- Workflow `.github/workflows/reminders.yml` ist vorhanden.
- Firestore-Regeln liegen versioniert in `firestore.rules`.

## Einmalig: Server-Zugang als GitHub Secret hinterlegen

Damit GitHub Actions Firestore lesen und Push-Nachrichten über FCM senden darf, braucht der Workflow einen privaten Firebase-Service-Account. Dieser Schlüssel darf **niemals** in das Repository committed werden.

1. Firebase Console öffnen.
2. **Projekteinstellungen → Dienstkonten / Service accounts** öffnen.
3. Unter **Firebase Admin SDK** auf **Neuen privaten Schlüssel generieren / Generate new private key** klicken.
4. Die heruntergeladene JSON-Datei öffnen und den **gesamten JSON-Inhalt** kopieren.
5. GitHub öffnen: `meltzow/ferienhaus-montalivet` → **Settings → Secrets and variables → Actions**.
6. **New repository secret** wählen.
7. Name exakt: `FIREBASE_SERVICE_ACCOUNT`
8. Als Wert den kompletten Inhalt der JSON-Datei einfügen und speichern.

Die JSON-Datei danach sicher aufbewahren oder lokal löschen. Sie darf nicht in GitHub hochgeladen werden.

## Firestore-Regeln einmalig in Firebase veröffentlichen

Der Firebase-CLI-Deploy über den Admin-SDK-Service-Account benötigt zusätzliche Google-Cloud-IAM-Rechte (`serviceusage.services.get`). Für dieses kleine Projekt ist es einfacher und sicherer, die Regeln direkt in der Firebase Console zu veröffentlichen.

1. Firebase Console → Projekt `ferienhaus-montalivet`.
2. **Firestore Database → Rules / Regeln** öffnen.
3. Den kompletten Inhalt aus `firestore.rules` im GitHub-Repository in den Editor kopieren.
4. **Publish / Veröffentlichen** drücken.

Die Datei `firestore.rules` bleibt die versionierte Referenz im Repository. Bei späteren Änderungen müssen Console und Repository synchron gehalten werden.

## Push auf der Webseite freischalten

Wenn die Firestore-Regeln veröffentlicht sind, in `firebase-config.js`:

```js
enabled: false,
```

auf

```js
enabled: true,
```

ändern. Danach PWA-Cache-Version in `sw.js` erhöhen.

## Erstes Gerät registrieren

1. GitHub Pages neu laden bzw. die installierte PWA neu öffnen.
2. Abreisedatum setzen und speichern.
3. **Benachrichtigungen aktivieren** drücken.
4. Browser-/Systemfreigabe erlauben.
5. In Firestore erscheint anschließend ein Dokument unter `reminderRegistrations`.

Auf iPhone/iPad muss die Seite zuerst als Home-Screen-Web-App installiert und von dort geöffnet werden.

## Push sofort testen

Sobald mindestens ein Gerät registriert ist:

1. GitHub → **Actions → Ferienhaus Erinnerungen**.
2. **Run workflow**.
3. Modus `test` auswählen.
4. Nach erfolgreichem Lauf sollte sofort eine Testbenachrichtigung eintreffen.

Der normale Zeitplan verwendet automatisch den Modus `scheduled`.

## Wichtig beim Jahreswechsel

Der automatische Müll-Push ist absichtlich auf den offiziell geprüften Müllplan **2026** begrenzt. Für 2027 wird kein Müll-Push versendet, bis der neue Müllplan geprüft und die Jahreszahl im Reminder-Skript aktualisiert wurde. Abreise-Erinnerungen funktionieren unabhängig davon weiter.
