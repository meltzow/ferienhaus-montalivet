# Phase 2a – Push-Benachrichtigungen einrichten

Der Code für Müll- und Abreise-Erinnerungen ist bereits im Repository. Die Funktion bleibt für Gäste unsichtbar, bis Firebase einmalig verbunden wurde.

## Architektur

- GitHub Pages bleibt die Web-App / PWA.
- Firebase Authentication meldet jedes Gerät anonym an.
- Cloud Firestore speichert nur die aktive Geräte-Registrierung, Abreisedatum, Zeitzone und Sprache.
- Firebase Cloud Messaging (FCM) liefert Web-Push.
- Eine geplante Cloud Function läuft täglich um 18:15 Uhr `Europe/Paris` und prüft:
  - Dienstagabend: gelbe + grüne Tonne für Mittwoch
  - Mittwochabend: schwarze Tonne für Donnerstag, nach Müllplan 2026
  - am Abend vor der Abreise: Abreise-Checkliste
- Am bzw. nach dem Abreisetag wird die Geräte-Registrierung automatisch gelöscht.

## Einmalige Firebase-Einrichtung

1. In der Firebase Console ein neues Projekt anlegen, z. B. `ferienhaus-montalivet`.
2. Eine **Web-App** zum Projekt hinzufügen.
3. Unter **Authentication → Sign-in method** den Anbieter **Anonymous / Anonym** aktivieren.
4. **Cloud Firestore** anlegen; eine europäische Region wählen.
5. Unter **Project settings → Cloud Messaging → Web Push certificates** ein VAPID-Schlüsselpaar erzeugen.
6. Die Web-Konfiguration und den **öffentlichen** VAPID-Key in `firebase-config.js` eintragen und `enabled: true` setzen.
7. Für geplante Cloud Functions muss das Firebase-Projekt den Blaze-Tarif verwenden.
8. Firebase CLI installieren/anmelden und im Repository ausführen:

```bash
firebase login
firebase use --add
cd functions
npm install
cd ..
firebase deploy --only firestore:rules,functions
```

## Test

1. GitHub Pages nach dem Commit neu laden.
2. Abreisedatum setzen.
3. `Benachrichtigungen aktivieren` drücken und Browser-Freigabe erteilen.
4. In Firestore muss ein Dokument unter `reminderRegistrations` erscheinen.
5. Für einen schnellen Funktionstest kann die Schedule-Funktion temporär auf eine nahe Uhrzeit gestellt und danach wieder auf `15 18 * * *` zurückgesetzt werden.

## Datenschutz / gespeicherte Daten

Pro aktivem Gerät werden gespeichert:

- Firebase Installation ID (FID)
- anonym erzeugte Firebase-User-ID als Dokument-ID
- Abreisedatum
- Zeitzone
- Browsersprache
- letzter Kontakt / letzte gesendete Erinnerung

Es werden für Phase 2a keine Namen, E-Mail-Adressen oder Telefonnummern benötigt.

## Wichtig beim Jahreswechsel

Der automatische Müll-Push ist absichtlich auf den offiziell geprüften Müllplan **2026** begrenzt. Für 2027 wird kein Müll-Push versendet, bis der neue Plan geprüft und `WASTE_SCHEDULE_YEAR` in `functions/index.js` aktualisiert wurde. Abreise-Erinnerungen funktionieren unabhängig davon weiter.
