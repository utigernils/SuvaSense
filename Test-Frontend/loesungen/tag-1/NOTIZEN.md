# Notizen zur Tag-1 Referenz-Implementierung

Diese Notizen erklären, **warum** die Referenz so aussieht, und
zeigen Alternativen. Lies sie, **nachdem** du deine eigene Lösung
gebaut hast – der Vergleich ist lehrreicher als die Kopie.

## Warum `display: flex` mit `flex-direction: column`?

Damit der Footer immer am unteren Rand klebt, auch wenn der Inhalt
kurz ist.

```css
body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

main {
    flex: 1;   /* füllt den verbleibenden Platz */
}
```

**Alternative:** CSS Grid mit `grid-template-rows: auto 1fr auto`.
Beides funktioniert, Flex ist etwas verbreiteter.

## Warum diese Status-Farben?

- **Grünlich/orange/rot** sind universelle "Ampel"-Farben. Sie
  funktionieren auch für Farbenblinde einigermassen, wenn
  Helligkeit und Form sich zusätzlich unterscheiden.
- Die Hintergrundfarben (`#e8f5e9`, `#fff3e0`, `#ffebee`) sind
  die Material-Design-Pastelltöne. Sie sind hell genug, dass
  schwarze Schrift darauf lesbar bleibt.
- Die Schriftfarben (`#2e7d32`, `#e65100`, `#c62828`) sind die
  zugehörigen Material-700-Töne – sattes Grün/Orange/Rot, das
  auf hellem Hintergrund poppt.

**Alternative:** Eigene Farbpalette aus dem Firmen-CD. Hauptsache
die drei Klassen sind semantisch klar unterscheidbar.

## Warum `box-sizing: border-box`?

Ohne diese Regel zählen `padding` und `border` zur **Gesamtbreite**
eines Elements dazu. Ein Element mit `width: 280px; padding: 20px`
ist dann effektiv 320 px breit und sprengt das Layout. Mit
`box-sizing: border-box` zählt das Padding **innerhalb** der
angegebenen Breite.

**Faustregel:** Setze `box-sizing: border-box` immer als allererste
Regel global (`* { ... }`). Damit verhält sich CSS so, wie man
intuitiv erwartet.

## Warum `max-width: 800px` auf `<main>`?

Auf grossen Bildschirmen würde das Dashboard sonst über die ganze
Breite gehen und die Werte-Paare würden auseinandergezogen. Eine
maximale Breite hält den Inhalt lesbar und konzentriert.

**Alternative:** `max-width: 60ch` (in Zeichen gemessen) – passt
sich der Schriftgrösse an. Beliebt in leselastigen Layouts.

## Warum diese Status-Initialwerte?

Im HTML steht:

```html
<div class="status gut" id="status">Gut</div>
```

Der Status wird mit der Klasse `gut` **vorbelegt**, damit der
Lernende beim ersten Öffnen der Seite etwas Grünes sieht und
versteht, dass die CSS-Klasse greift. Tag 2 ändert die Klasse
dynamisch per JavaScript (`element.className = 'status ' + status`).

**Alternative:** `class="status"` ohne Status-Vorbelegung. Das
Status-Badge wäre dann zunächst ohne Farbe, bis JavaScript läuft.
Etwas sauberer, aber für Anfänger weniger offensichtlich.

## Warum `flex-direction: column` für die Karte?

Nicht im CSS, aber im HTML: innerhalb der `.card` stapeln sich
Titel, Werte und Status von oben nach unten. Das ist die normale
Lesereihenfolge und braucht kein zusätzliches CSS – `display:
block` (Default für `div`) reicht.

**Falls du `display: flex` setzt:** Du brauchst dann
`flex-direction: column` explizit, sonst wird alles horizontal
nebeneinander angeordnet.

## Was bewusst NICHT in der Referenz steht

- **CSS-Variablen** (z. B. `--color-teal`) – nützlich, aber für
  Tag 1 zu viel. Könnte Tag-2-Bonus werden.
- **CSS-Klassen für den Layout-Container** (`.dashboard`,
  `.container`) – hier unnötig, weil `<main>` schon der Container ist.
- **Reset-Stylesheet** (z. B. `normalize.css`) – im Bootcamp zu
  viel Overhead, der Browser-Default reicht.
- **Dark Mode** – Tag-4-Optional-Feature.
- **Icons** (Schloss, Sensor-Symbol etc.) – Tag-4-Optional-Feature.

## Lösungs-Varianten, die auch okay wären

- `padding` grösser oder kleiner
- `border-radius` mehr oder weniger
- Andere Hauptfarbe statt Teal
- `box-shadow` stärker oder weggelassen
- Status-Farben aus einem anderen Design-System (Tailwind,
  Bootstrap)
- Statt `grid` für die zwei Werte: `flex` mit `justify-content:
  space-between`

Alle diese Varianten sind **korrekt**, solange die IDs/Klassen
stimmen und das Layout responsiv ist.