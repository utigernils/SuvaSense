# Notizen zu Tag 4 – PE-Lösungen

Diese Notizen erklären die **Design-Entscheidungen** hinter der
Referenz-Implementierung. Lies sie **nachdem** du dein eigenes
Coaching vorbereitet hast.

## Warum Stresstest im Bootcamp?

Ein **einzelner** Sensor live bedeutet: die Kette funktioniert
**für diesen einen Fall**. Für die Demo brauchen wir:
- Mehrere Sensoren parallel
- Längere Laufzeit
- Robustheit gegen Störungen

**Was ein Stresstest NICHT prüft** (für Produktion, nicht Bootcamp):
- 1000+ Sensoren
- Skalierung
- Hochverfügbarkeit
- Last-Tests unter 1000+ Requests/s

**Stresstest im Bootcamp** ist **Vertrauensbildung**:
- Lernende sehen, dass die Plattform **mit Last umgehen kann**
- Trainer kann am Tag 4 Abend **ohne Bauchschmerzen** präsentieren
- Eine Stunde reicht, um die häufigsten Probleme zu finden

## Warum 1 Stunde Laufzeit?

| Dauer | Was wir lernen |
|---|---|
| 5 Min | Funktioniert, aber nicht robust |
| 30 Min | Die meisten Bugs zeigen sich |
| **1 h** | Genug Zeit für Edge Cases (z. B. Speicher-Leaks langsam) |
| 24 h | Bootcamp-Overhead zu groß, nicht realistisch |

**1 Stunde** ist der **Sweet Spot** für den Bootcamp: lang genug
für die häufigsten Probleme, kurz genug, dass es in den Tagesplan
passt.

## Warum mehrere Sensoren simulieren mit mosquitto_pub?

**Echte ESPs** sind begrenzt (typisch 3–5 pro Bootcamp). Um den
Stresstest aussagekräftig zu machen, simulieren wir die
fehlenden mit `mosquitto_pub -r`.

**`retained = true` ist nur für Test-Sensoren OK** – damit der
Broker die letzte Message speichert und der Subscriber sie
sofort bekommt. Echte Sensoren publishen mit `retained = false`,
weil Sensordaten veralten (siehe
[mqtt-vertrag](../../../pe-raumklima-bootcamp/docs/projekt/mqtt-vertrag.md)).

## Warum `docker stats`?

`docker stats` zeigt **Live-Ressourcenverbrauch** pro Container
(RAM, CPU, Netzwerk). Damit sehen wir:

- **Memory-Leaks** im Backend: RAM wächst kontinuierlich
- **CPU-Spitzen** bei bestimmten Last-Patterns
- **Netzwerk-Limit** wenn viele Sensoren gleichzeitig publishen

**Im Bootcamp reicht der Blick auf RAM** (CPU und Netzwerk sind
für unsere Last trivial). Wenn Backend-RAM nach 30 Min über
200 MB geht → Bug, restart, Trainer fragen.

## Warum Backup-Pflicht?

**Realität:** Live-Demos crashen. Manchmal aus unerklärlichen
Gründen. Murphy's Law.

**Vorbereitung:**
- **VM-Snapshot** (in Proxmox-Web-UI) → komplette VM in 30 s
  wiederherstellbar
- **pg_dump** (Cron täglich 17:00) → Datenbank in 10 s
  wiederherstellbar
- **Backup-Video** (Screen-Recording) → Demo in 30 s zeigbar,
  wenn alles live crasht

Diese drei Layer bedeuten: **egal was live kaputtgeht, die
Demo funktioniert**.

## Warum 5-7 Min für die Demo?

| Dauer | Effekt |
|---|---|
| < 3 Min | Zu wenig, wirkt lieblos |
| **5–7 Min** | Genug für Highlights, kurz genug für Aufmerksamkeit |
| > 10 Min | Publikum wird unruhig |

Die **5-7 Min** sind der Standard im Bootcamp: genug für 5–6
Highlights (Hardware, MQTT, Backend, DB, Frage-Pause), kurz
genug, dass das Publikum nicht abschaltet.

## Warum eine Probe-Demo VOR der echten Show?

Eine **Live-Demo** ohne Probe ist Glücksspiel. Eine **Probe-Demo**
30 Min vorher:

- Deckt technische Probleme auf (z. B. falsche IP im Skript)
- Deckt Timing-Probleme auf (z. B. zu langsam beim Tab-Wechsel)
- Gibt dem Präsentator Sicherheit
- Dauert nur 7 Min, verhindert aber 60 Min Chaos

**Faustregel:** Eine Probe-Demo ist nicht optional.

## Warum 6 Worst-Case-Backup-Pläne?

Live-Demos crashen auf **viele verschiedene Arten**. Die 6 Pläne
decken die häufigsten ab:

1. **ESP ohne WLAN** – Hotspot-Fallback
2. **Broker-Container crasht** – `docker compose restart`
3. **Backend-Health rot** – restart, dann Backup-Video
4. **Postgres weg** – Container neu starten, Snapshot-Fallback
5. **Komplett tot** – Backup-Video (aufgezeichnet gestern Abend)
6. **Demo-Live crasht** – Backup-Video zeigen, weiter

**Die 6 Pläne sind nicht exklusiv** – im Notfall kombinierst du
sie ("Plattform down UND Backup-Video geht nicht" → ehrlich
sein, Daten aus dem Snapshot zeigen).

## Warum Backup-Video 30-60 Sek?

| Dauer | Wann? |
|---|---|
| 5–10 s | Zu kurz, zeigen nur einen Ausschnitt |
| **30–60 s** | Genug für 1–2 Highlights, kurz genug zum Abspielen |
| > 2 Min | Zu lang, das Publikum wird ungeduldig |

Das Video zeigt **einen** Highlight-Moment (z. B. Live-Stream
mit `mosquitto_sub` läuft), nicht die ganze Demo.

## Was bewusst NICHT in der Referenz steht

- **K6-Last-Test** (1000+ Sensoren) – out of scope
- **Chaos-Engineering** (zufällige Container-Kills) – zu komplex
- **Real-User-Monitoring** (z. B. Datadog) – Overkill
- **CDN / Edge-Caching** – irrelevant für lokales MQTT
- **Microservices-Aufteilung** – wir haben schon 4 Services,
  mehr ist Overkill

## Häufige Anfängerfehler beim 1:1-Coaching

1. **"Der RAM-Verbrauch sieht hoch aus"** – ohne Vergleichswert
   panikmachen. 200 MB für ein Go-Backend mit Postgres-Pool ist
   normal
2. **"Eine Message fehlt"** – QoS-1 Redelivery, normal. Nicht
   dramatisch ranken
3. **"Eine Tabelle ist 5 % langsamer"** – DB-Cache warm-up, nach
   5 Min wieder normal
4. **"Mein Live-Curl crasht, das ist ein Bug"** – oft ist es
   einfach ein 404, kein Crash. Statuscode genau anschauen

## Lösungs-Varianten, die auch okay wären

- **Stresstest mit nur 2 Sensoren** statt 5 – Aussagekraft
  geringer, aber besser als kein Test
- **Manuelles Skript** statt Cronjob – funktioniert, aber
  fehleranfällig
- **30 Min statt 1 h Laufzeit** – weniger Vertrauen, geht
  schneller
- **Probe-Demo alleine im Team** statt vor der Klasse –
  weniger Lerneffekt

Alle sind **korrekt** für den Bootcamp.

## Siehe auch

- [stresstest-commands.md](stresstest-commands.md) – alle
  Befehle zum Kopieren
- [demo-skript.md](demo-skript.md) – 5-7 Min Skript
- [backup-pflicht-skript.md](backup-pflicht-skript.md) – Snapshot
  + pg_dump + Cronjob
- [pe-raumklima-bootcamp/docs/tag-4/theorie-stresstest.md](../../../pe-raumklima-bootcamp/docs/tag-4/theorie-stresstest.md) – Stresstest-Theorie