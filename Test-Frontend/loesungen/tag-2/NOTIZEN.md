# Notizen zur Tag-2 Referenz-Implementierung

Diese Notizen erklären **Design-Entscheidungen** und Alternativen.
Lies sie **nachdem** du deine eigene Lösung gebaut hast.

## Warum `bundles[0]` der neueste ist

Die `data.json` ist so sortiert, dass der **neueste** Eintrag
zuerst kommt. Das Backend (SuvaSense) liefert es genauso. Das
spart eine separate `sort()`-Operation im Frontend.

**Alternative:** Falls du `data.sort()` brauchst (z. B. weil die
Quelle unsortiert ist), sortiere nach `recorded_at` absteigend:

```javascript
bundles.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
```

## Warum die Schwellwerte so gewählt sind

Die Schwellwerte orientieren sich an gängigen Empfehlungen für
Innenräume:

- **20–24 °C "gut":** ASHRAE-Empfehlung für Büroräume (Sommer
  wie Winter ähnlich, ca. 21–23 °C)
- **40–60 % "gut":** Relative Feuchte, bei der Schimmelwachstum
  unwahrscheinlich und Atemwege sich wohlfühlen
- **18–26 °C "kritisch":** Noch akzeptabel, aber Komfort leidet
- **30–70 % "kritisch":** Trocken oder feucht, aber noch nicht
  gesundheitsschädlich
- **Ausserhalb: "schlecht":** Entweder zu kalt/zu heiss oder
  gesundheitlich bedenklich (Schimmel, Elektrostatik)

**Didaktischer Hinweis:** Echte Produktivsysteme haben **andere**
Schwellwerte, je nach Raumtyp (Server-Raum, Klassenzimmer, Museum).
Diskutiere im Team, welche Werte für **eure** Räume passen.

## Warum `de-CH` als Locale?

Schweizer Hochdeutsch nutzt 24-h-Format und einen Punkt als
Tausender-Trennzeichen (falls du das mal brauchst). `de-CH` ist
konsistent mit der Doku-Sprache.

**Alternative:** `de-DE` (Punkt als Tausender), `en-US` (12-h).

## Warum `bundle.readings && bundle.readings.bme680` defensiv?

Ein Push-Bundle **kann** weitere Sensortypen enthalten (`veml7700`,
`mpu6050`, `system`). Wenn ein Bundle **nur** `veml7700` liefert
(z. B. weil BME680 ausgefallen ist), gibt es `readings.bme680`
nicht. Die Prüfung verhindert einen Crash.

**Robustere Alternative:** Optionale Felder ins DOM rendern
(siehe Tag-3-Optional-Features).

## Warum `try/catch` um das gesamte `loadDashboard()`?

Damit die App bei jedem Fehler (kein Netzwerk, fehlerhaftes JSON,
fehlende Datei) zur Fehlermeldung zurückfällt – ohne dass der
User einen weissen Bildschirm sieht.

**Wichtig:** `showError()` muss idempotent sein, d. h. sie
kann mehrfach aufgerufen werden, ohne dass der DOM-State
kaputtgeht.

## Warum `bundles.slice(0, 10)`?

`renderHistory` bekommt **alle** Bundles, zeigt aber nur die
ersten 10. Im Tag-3-Setup wird das anders – dort holen wir über
`page_size=10` schon nur 10 Stück von der API.

**Vorsicht:** Beim Übergang zu Tag 3 darauf achten, dass die
Referenz dann das `limit`-Argument der API richtig nutzt.

## Was bewusst NICHT in der Referenz steht

- **Auto-Refresh** (`setInterval`) – Tag-4-Optional-Feature
- **Persistenz im LocalStorage** – Tag 3
- **Sensor-Auswahl-Dropdown** – Tag 3
- **Detaillierte Fehler-Toast-Benachrichtigungen** – Tag-4-Optional
- **Internationalisierung** (Texte in alle Sprachen) – out of scope

## Häufige Anfängerfehler

- **Falsche Reihenfolge:** `bundles[bundles.length - 1]` statt
  `bundles[0]` für den neuesten Wert
- **`fetch` ohne `await`:** `data = fetch('data.json')` ist ein
  Promise, kein Datenobjekt
- **`try/catch` vergessen:** Bei `data.json`-Umbenennung crasht
  die App statt sauber Fehler anzuzeigen
- **Status-Klasse nicht gesetzt:** `element.textContent` ändert
  den Text, aber die Farbe kommt von der Klasse

## Lösungs-Varianten, die auch okay wären

- `getStatus` als Arrow-Function statt function declaration
- `bundles.sort()` für mehr Robustheit
- Andere Locale (`de-DE` oder `en-US`)
- `??` (nullish coalescing) statt `||` für Defaults
- TypeScript-Annotationen (über den Bootcamp-Scope hinaus)