# Admin-Seite einmalig einrichten

Die Verwaltung liegt unter:

`https://meltzow.github.io/ferienhaus-montalivet/admin.html`

Redakteure benötigen keinen GitHub-Account. Sie melden sich mit einem in Firebase
angelegten E-Mail/Passwort-Konto an.

## 1. E-Mail/Passwort-Anmeldung aktivieren

1. Firebase Console öffnen und das Projekt `ferienhaus-montalivet` auswählen.
2. **Authentication → Sign-in method** öffnen.
3. **Email/Password** aktivieren. Die Registrierung per E-Mail-Link wird nicht benötigt.
4. Unter **Authentication → Settings → Password policy** eine angemessene
   Mindestlänge und Zeichenanforderungen festlegen.

Die Admin-Seite enthält absichtlich keine öffentliche Registrierung. Neue
Admin-Konten werden nur in der Firebase Console angelegt.

## 2. Admin-Benutzer anlegen

1. **Authentication → Users → Add user** öffnen.
2. E-Mail-Adresse und ein starkes Passwort eintragen.
3. Den neuen Benutzer öffnen und seine **User UID** kopieren.

## 3. Benutzer als Admin freischalten

1. **Firestore Database → Data** öffnen.
2. Collection `admins` anlegen, falls sie noch nicht existiert.
3. Ein Dokument anlegen, dessen Document ID exakt die kopierte User UID ist.
4. Feld `active` vom Typ Boolean mit dem Wert `true` eintragen.

Zum Sperren eines Zugangs `active` auf `false` setzen oder das Konto in Firebase
Authentication deaktivieren. Das Admin-Dokument kann nicht über die Webseite
verändert werden.

## 4. Firestore-Regeln veröffentlichen

Die Admin-Seite funktioniert erst, wenn die aktuelle Datei `firestore.rules`
veröffentlicht wurde:

1. **Firestore Database → Rules** öffnen.
2. Den vollständigen Inhalt von `firestore.rules` aus diesem Repository einfügen.
3. **Publish** drücken.

Die Regeln erlauben allen Gästen das Lesen der öffentlichen Hausinhalte und
Mülltermine. Schreiben dürfen ausschließlich aktive Admin-Benutzer. Die
Geräte-Registrierungen für Push bleiben weiterhin pro Gastkonto geschützt.

## 5. Erste Inhalte veröffentlichen

1. `admin.html` öffnen und anmelden.
2. Die aus `house-data.js` geladenen Grunddaten prüfen.
3. **Änderungen veröffentlichen** drücken.

Dadurch entsteht das Dokument `houseContent/main`. Ab diesem Zeitpunkt lädt die
Gäste-App die administrierten Inhalte aus Firestore. Bei fehlender Verbindung
verwendet sie den zuletzt geladenen Stand oder die mitgelieferten Grunddaten.

## Mülltermine

Ein manueller Mülltermin überschreibt den eingebauten Plan für genau ein Datum:

- **Aktiv:** Der eingetragene Push-Text wird am Vorabend versendet.
- **Deaktiviert:** Für dieses Datum wird keine Müll-Erinnerung versendet.
- **Gelöscht:** Für dieses Datum gilt wieder der eingebaute Müllplan 2026.

Die Abreise-Erinnerung ist davon unabhängig.
