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
- Anonymous Authentication und Firestore müssen im Firebase-Projekt aktiviert sein.
- Workflow `.github/workflows/reminders.yml` ist vorhanden.
- Firestore-Regeln liegen in `firestore.rules`.

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

## Firestore-Regeln einmalig veröffentlichen

Nach dem Secret:

1. GitHub → Repository → **Actions**.
2. Workflow **Firebase Regeln deployen** öffnen.
3. **Run workflow** starten.
4. Der Lauf muss grün enden.

Der Workflow nutzt den gleichen Service-Account und veröffentlicht ausschließlich `firestore.rules`. Es werden keine Cloud Functions deployed.

## Push auf der Webseite freischalten

Wenn der Regeln-Workflow erfolgreich war, in `firebase-config.js`:

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
2. Abreisedatum speichern.
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

## Datenschutz / gespeicherte Daten

Pro aktivem Gerät werden gespeichert:

- Firebase Installation ID (FID)
- anonym erzeugte Firebase-User-ID als Dokument-ID
- Abreisedatum
- Zeitzone
- Browsersprache
- letzter Kontakt / letzte gesendete Erinnerung

Keine Namen, E-Mail-Adressen oder Telefonnummern sind für Phase 2a nötig.

## Kostenlos-Limits / Besonderheiten

Für dieses kleine Ferienhaus-Szenario liegen die Firestore-Zugriffe sehr weit unter den kostenlosen Quoten. GitHub Actions ist für das öffentliche Repository mit Standard-Runnern kostenlos.

Wichtig: GitHub deaktiviert geplante Workflows in öffentlichen Repositories automatisch, wenn 60 Tage lang keine Repository-Aktivität stattgefunden hat. Dann muss der Workflow unter **Actions** wieder aktiviert werden.

## Jahreswechsel

Automatische Müll-Pushs sind absichtlich auf den geprüften Müllplan **2026** begrenzt. Vor 2027 muss `WASTE_SCHEDULE_YEAR` in `scripts/send-reminders.mjs` nach Prüfung des neuen Müllplans aktualisiert werden. Abreise-Erinnerungen funktionieren davon unabhängig.
