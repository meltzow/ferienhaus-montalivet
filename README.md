# Ferienhaus Montalivet – Phase 1

Das ist eine **statische, mobile Web-App / PWA** für GitHub Pages.

## Enthalten

- mobile Startseite mit Schnellzugriff
- Inhalte aus den 7 Fotos des Hausbuchs
- Müllhinweise nach Wochentag:
  - Mittwoch: Verpackungen/Papier + Bioabfall
  - Donnerstag in ungeraden Kalenderwochen: Restmüll
- Abreisedatum lokal auf dem Gastgerät
- hervorgehobener Hinweis vor/am Abreisetag
- abhakbare Abreise-Checkliste
- Frage/Problem per vorbereiteter WhatsApp-Nachricht
- PWA / "Zum Startbildschirm hinzufügen"
- Offline-Cache für die Kernseiten
- Originalfotos des Hausbuchs als Referenz

## Vor Veröffentlichung anpassen

Öffne `house-data.js` und trage bei

```js
ownerWhatsApp: ""
```

die WhatsApp-Nummer des Hauseigentümers ein.

Format z. B. für eine deutsche Mobilnummer:

```js
ownerWhatsApp: "491701234567"
```

also ohne `+`, Leerzeichen oder führende `0`.

## Lokal testen

Einfach im Ordner einen kleinen Webserver starten, z. B.:

```bash
python3 -m http.server 8000
```

Danach im Browser öffnen:

```text
http://localhost:8000
```

Service Worker / PWA-Funktionen funktionieren am zuverlässigsten über HTTPS
(bei GitHub Pages automatisch vorhanden).

## Auf GitHub Pages veröffentlichen

1. Neues Repository anlegen, z. B. `ferienhaus-montalivet`
2. Den **Inhalt dieses Ordners** in das Repository hochladen
3. In GitHub: `Settings` → `Pages`
4. Deployment aus dem Branch `main`, Verzeichnis `/ (root)` auswählen
5. Nach dem Deployment die veröffentlichte URL öffnen
6. Aus genau dieser URL anschließend den QR-Code erstellen

## Wichtig für Phase 1

GitHub Pages ist statisch. Daher gibt es in dieser Version:

- **keinen Eigentümer-Login**
- **keine zentrale Speicherung von Aufenthalten**
- **keine echte automatische Push-Erinnerung bei geschlossener Seite**
- **keine KI-Fragefunktion**

Diese Punkte wären Phase 2/3.

## Dateien

- `index.html` – Oberfläche
- `styles.css` – Design
- `house-data.js` – Inhalte / Konfiguration
- `app.js` – Logik
- `manifest.webmanifest` – PWA
- `sw.js` – Offline-Cache
- `assets/source/` – Originalfotos
