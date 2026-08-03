# Notizen zur Tag-3 Referenz-Implementierung

Diese Notizen erklären **Design-Entscheidungen** der
Snapshot-Fallback-Strategie. Lies sie **nachdem** du deine eigene
Lösung gebaut hast.

## Warum drei separate try/catch-Blöcke?

Jede Phase ist **unabhängig** und kann separat fehlschlagen:

- Phase 1: API nicht erreichbar → `fetch` wirft
- Phase 2: Snapshot existiert nicht oder ist kaputt → `getItem`
  gibt `null` oder `JSON.parse` wirft
- Phase 3: `data.json` fehlt → `fetch` wirft

Mit **einem** grossen `try/catch` könntest du nicht zwischen
"API ist down" und "Snapshot ist kaputt" unterscheiden. Drei
separate Blöcke machen den Code robuster und die Logs klarer.

## Warum `data.items || []`?

Manche API-Versionen (z. B. bei leeren Ergebnissen) liefern
`{ "items": null }` statt `{ "items": [] }`. Der Fallback auf
ein leeres Array verhindert einen späteren `null.length`-Crash.

**Alternative:** `data.items ?? []` (nullish coalescing, ES2020).
Macht das gleiche, ist moderner.

## Warum `JSON.stringify(items)` im Snapshot?

`localStorage` kann nur **Strings** speichern, keine Objekte.
`JSON.stringify` konvertiert das Array in einen String;
`JSON.parse` macht es beim Lesen wieder zum Array.

**Falle:** `JSON.stringify(undefined)` liefert `undefined` (kein
String), was `localStorage` stillschweigend ignoriert. Stelle
sicher, dass `items` immer ein Array ist (siehe oben).

## Warum `page_size=10`?

Wir wollen nur 10 Bundles pro Request. Mehr würde die App
verlangsamen und das LocalStorage aufblähen.

**Diskussion:** Ist `10` die richtige Zahl? Für eine Demo ist es
genug. Für eine Produktiv-App würde man Pagination mit "Nächste
10 laden" einbauen (z. B. mit `IntersectionObserver`).

## Warum `console.warn` statt `console.error`?

- Phase 1 schlägt fehl → `warn` (erwartet, das ist der Sinn
  der Fallback-Strategie)
- Phase 3 schlägt **komplett** fehl → `error` (wirkliches Problem)

Diese Unterscheidung hilft beim Debuggen: viele `warn` ist
normal, viele `error` deutet auf ein echtes Problem hin.

## Warum `getLatestBundle` als Wrapper?

Klarheit im Code. `loadDashboard` arbeitet mit **einem** Bundle;
`getBundles` liefert **viele**. Der Wrapper abstrahiert die
List-Logik weg.

**Alternative:** `getBundles(serial, 1).then(b => b[0])` – funktioniert
auch, ist aber weniger lesbar.

## Warum `getBundles` **zweimal** aufgerufen wird in `loadDashboard`?

```javascript
const latest = await getLatestBundle(currentSerial);   // Phase 1+2 holt 10
const bundles = await getBundles(currentSerial, 10);    // Phase 1+2 nochmal
renderHistory(bundles);
```

**Ineffizient?** Ja, suboptimal. Besser:

```javascript
const bundles = await getBundles(currentSerial, 10);
const latest = bundles[0];
renderHistory(bundles);
```

Die Referenz zeigt die **ineffiziente** Variante absichtlich, weil
sie einfacher zu lesen ist. Für eine Produktiv-App solltest du
`getLatestBundle` weglassen und einmal `getBundles` aufrufen.

## Warum Snapshot **pro Sensor** (`snapshotKey(serial)`)?

Wenn der Lernende zwischen Sensoren wechselt, soll der Snapshot
für **jeden** Sensor separat gelten. Sonst würde der Snapshot
von `SN12345` fälschlicherweise für `SN67890` angezeigt.

**Speicherplatz:** 10 Push-Bundles × ~400 Bytes = 4 KB pro
Sensor. Für 10 Sensoren also 40 KB – localStorage hat typisch
5–10 MB pro Origin. Kein Problem.

## Was bewusst NICHT in der Referenz steht

- **Auto-Refresh** alle 30 Sekunden – Tag-4-Optional-Feature
- **Cache-Invalidation** (z. B. Snapshot nach 1 h löschen) –
  out of scope
- **Service Worker** für Offline-First – Tag-4-Optional
- **Retry mit Backoff** bei API-Fehlern – Tag-4-Optional
- **Mehrere Snapshots mergen** (für lange Offline-Phasen) – out
  of scope

## Häufige Anfängerfehler

- **`data.json` als Fallback vergessen** – wenn API und
  Snapshot beide fehlen, crasht die App
- **Snapshot nicht pro Sensor trennen** – Wechsel zeigt
  falsche Werte
- **`JSON.parse(cached)` ohne try/catch** – kaputter Snapshot
  crasht die ganze App
- **`renderHistory` mit den falschen Bundles** – Liste zeigt
  Einträge vom falschen Sensor nach Wechsel
- **Race Condition bei schnellem Sensor-Wechsel** – wenn der
  User schnell klickt, können alte Responses die neuen
  überschreiben. Lösung: Request-Cancel-Tokens (zu komplex für
  Tag 3)

## Lösungs-Varianten, die auch okay wären

- Snapshot in **sessionStorage** (geht beim Browser-Close
  verloren)
- Snapshot mit **max age** (`{ ts: Date.now(), items: [...] }`)
  und 1-h-TTL
- **Dynamisches Dropdown** aus `GET /api/v1/sensors`
- **Direkter `getBundles`-Aufruf in `loadDashboard`** statt
  `getLatestBundle` als Wrapper
- **Fetch mit `AbortController`** zur Vermeidung von
  Race-Conditions