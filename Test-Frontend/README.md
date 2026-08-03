# Test-Frontend (AE Raumklima Bootcamp)

Dieser Ordner enthält das **Frontend exakt nach Lernanleitung** plus einen
**schlanken lokalen Test-Server**, der das SuvaSense-Push-Bundle-Schema
liefert. Damit kann das Frontend gegen eine SuvaSense-kompatible API
getestet werden, ohne dass der ganze Docker-Stack läuft.

## Zweck

Das Frontend in `app/` ist **identisch** zu dem, was ein Lernender nach
Tag 1–3 bauen würde (HTML + CSS + JS nach den Lern-Docs). Der
Test-Server ersetzt während der Entwicklung das echte SuvaSense-Backend
durch ein lokal laufendes Python-Skript.

Sobald `test-server.py` läuft, kann das Frontend ohne Anpassung gegen
eine echte SuvaSense-Instanz getestet werden – nur die `API_BASE`-Konstante
in `app/script.js` muss umgestellt werden.

## Start

### 1. Test-Server starten (ein Terminal)

```bash
cd Test-Frontend
python3 test-server.py
```

Ausgabe:

```
SuvaSense-kompatibler Test-Server auf Port 8090
Endpoints:
  GET http://localhost:8090/health
  GET http://localhost:8090/api/v1/sensors
  GET http://localhost:8090/api/v1/sensors/SN12345/readings?page=1&page_size=10
Frontend API_BASE = 'http://localhost:8090/api/v1'
Drücke Ctrl+C zum Beenden.
```

Smoke-Test in einem zweiten Terminal:

```bash
curl http://localhost:8090/health
# → {"status":"ok"}

curl 'http://localhost:8090/api/v1/sensors/SN12345/readings?page=1&page_size=2' | python3 -m json.tool
```

### 2. Frontend im Browser öffnen (zwei Terminals / VS Code Live Server)

Im `app/`-Ordner:

```bash
# Option A: VS Code Live Server (empfohlen wie in den Docs)
code app/
# Rechtsklick auf index.html → "Open with Live Server"

# Option B: Python http.server
cd app
python3 -m http.server 5500
# Browser: http://localhost:5500
```

### 3. Was du im Browser sehen solltest

- **Dashboard:** Sensor `SN12345`, Temperatur und Luftfeuchtigkeit aus dem
  ersten Push-Bundle, Status-Farbe (grün/orange/rot je nach Wert)
- **Verlauf:** 10 Push-Bundles mit Zeit, Temperatur, Feuchte, Status-Pille
- **Admin-Panel** (aufgeklappt): Dropdown mit `SN12345`/`SN67890`/`DEMO-001`,
  Button "Aktualisieren"
- **Sensor wechseln:** Daten ändern sich entsprechend

## Schema-Tests

Der Test-Server liefert **exakt** das Schema aus
`ae-raumklima-bootcamp/docs/projekt/api-vertrag.md`:

| Endpoint | Schema-Feld |
|---|---|
| `GET /api/v1/sensors` | `items[].serial_number, .status, .readings_by_type` |
| `GET /api/v1/sensors/{serial}` | alle Sensor-Felder |
| `GET /api/v1/sensors/{serial}/latest` | `latest.bme680/veml7700/system` |
| `GET /api/v1/sensors/{serial}/readings` | `mode: "push-bundles"`, `items[].readings.bme680.temp_c/hum_pct` |

Bei Unstimmigkeiten zwischen Docs und Server bitte melden – sie sind
Hinweise auf Doc-Bugs.

## Snapshot-Fallback manuell testen

Im Browser-DevTools (F12) → Application → LocalStorage:

```javascript
// Snapshot für SN12345 löschen, App zeigt Initial-Seed:
localStorage.removeItem('snapshot:SN12345');

// Test-Server "abschiessen" (Ctrl+C im Terminal):
// App fällt auf Snapshot (wenn vorhanden) oder data.json zurück.

// data.json umbenennen, alles löschen:
// App zeigt Fehlermeldung "Keine Daten verfügbar".
```

## Tags, die das Frontend abdeckt

- **Tag 1:** `index.html`, `style.css` (Grundgerüst, Dashboard, Status-Klassen)
- **Tag 2:** `data.json`, `script.js` (`getStatus`, `loadDashboard`, `renderHistory`, `showError`)
- **Tag 3:** `script.js` (`getBundles` mit Snapshot-Strategie, `getLatestBundle`),
  Admin-Panel in `index.html` + `style.css`

Nicht enthalten sind optionale Features (Dark Mode, Diagramm,
Auto-Refresh, Benachrichtigungs-Banner, weitere Sensortypen-Anzeige) –
die sind im Lernpfad explizit optional.

## Auf echtes SuvaSense umstellen

In `app/script.js`:

```javascript
// alt:
const API_BASE = 'http://localhost:8090/api/v1';

// neu:
const API_BASE = 'http://<vom-trainer>:8080/api/v1';
```

Mehr ist nicht nötig – das Frontend spricht bereits im korrekten
Push-Bundle-Format.

## Trainer-Material: `loesungen/`

Im Schwester-Ordner `loesungen/` (auf gleicher Ebene wie `app/`)
liegen die **Referenz-Implementierungen** für die Tag-1-bis-Tag-3-
Projektaufgaben. **Dieser Ordner ist nur für Trainer** – Lernende
haben keinen Zugriff.

Inhalt:
- `loesungen/tag-1/` – HTML, CSS, NOTIZEN
- `loesungen/tag-2/` – data.json, script.js, NOTIZEN
- `loesungen/tag-3/` – script.js, NOTIZEN
- `loesungen/index.md` – Konzept und Workflow

Die Lösungen sind absichtlich **nicht** im Lernmaterial, damit
Lernende selbst knobeln statt abschreiben. Verwende sie für
1:1-Coaching und Code-Reviews – mehr dazu in
`loesungen/index.md`.