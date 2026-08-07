# NOTIZEN zu Tag 4 – Design-Entscheidungen

Diese Notizen erklären die **Design-Entscheidungen** hinter der
Tag-4-Referenz. Lies sie **nachdem** du dein eigenes Coaching
vorbereitet hast.

## Warum Tag 4 keine Code-Lösungen hat

Tag 4 ist im PE-Repo ein **Test-/Demo-Tag**, kein Programmier-Tag.
Die Übungen sind:

- **Hands-on Stresstest:** Befehle ausführen, Metriken beobachten
- **Hands-on Demo-Skript:** Skript vorbereiten, Probe-Demo
- **Hands-on Backup:** Snapshots, pg_dump, Backup-Video

**Es gibt nichts zu programmieren**, weil die Plattform bereits
in Tag 1–3 gebaut wurde. Tag 4 beweist, dass sie funktioniert.

**Anders als Tag 1–3** (Spec+Skelett-Stil, Lernende schreiben
Code) ist Tag 4 ein **Operations-Tag** (Trainer führt aus,
Lernende schauen zu).

## Warum Timeshift statt Docker-Volume-Backup

**Timeshift** ist das Standard-Tool für Debian-System-Snapshots
(`apt install timeshift`). Es erfasst:

- `/etc`, `/var`, `/usr/local`
- Installierte Pakete
- User-Konfigurationen
- Boot-Snapshots

**Docker-Volumes** werden NICHT von Timeshift erfasst (sie sind
in `/var/lib/docker/volumes/` und Docker-verwaltet). Deshalb:

- **Timeshift** → System-Snapshot (Konfiguration, Pakete)
- **Docker-Volume-Tar** → Daten-Snapshot (Postgres-DB,
  Mosquitto-Persistenz)
- **pg_dump** → Logischer DB-Backup (lesbar, versionierbar)

**Drei Backup-Layer = drei Restore-Wege** = maximale Sicherheit.

## Warum `mosquitto_pub -r` für Test-Sensoren

`-r` (retained) bewirkt, dass der Broker die **letzte** Message
eines Topics speichert und sie jedem neuen Subscriber sofort
schickt. Für **echte Sensoren** ist das **falsch** (siehe
[MQTT-Vertrag](../../../pe-raumklima-bootcamp/docs/projekt/mqtt-vertrag.md)),
weil Sensordaten nach 10 s veralten und kein Wert im Broker
gespeichert werden soll.

Für **Test-Sensoren** ist es nützlich: nach dem Start des
Backends bekommt der Subscriber sofort Daten, auch wenn der
Test-Sensor schon vor 5 Min die letzte Message geschickt hat.

## Warum 1 Stunde Laufzeit

| Dauer | Was wir lernen |
|---|---|
| 5 Min | Funktioniert, aber nicht robust |
| 30 Min | Die meisten Bugs zeigen sich |
| **1 h** | Genug Zeit für Edge Cases (z. B. Speicher-Leaks langsam) |
| 24 h | Bootcamp-Overhead zu groß, nicht realistisch |

**1 Stunde** ist der **Sweet Spot** für den Bootcamp: lang genug
für die häufigsten Probleme, kurz genug, dass es in den Tagesplan
passt.

## Warum Probe-Demo VOR der echten Show

Eine **Live-Demo** ohne Probe ist Glücksspiel. Eine
**Probe-Demo** 30 Min vorher:

- Deckt technische Probleme auf (z. B. falsche IP im Skript)
- Deckt Timing-Probleme auf (z. B. zu langsam beim Tab-Wechsel)
- Gibt dem Präsentator Sicherheit
- Dauert nur 7 Min, verhindert aber 60 Min Chaos

**Faustregel:** Eine Probe-Demo ist nicht optional.

## Warum Backup-Video 30-60 s

| Dauer | Wann? |
|---|---|
| 5–10 s | Zu kurz, zeigen nur einen Ausschnitt |
| **30–60 s** | Genug für 1–2 Highlights, kurz genug zum Abspielen |
| > 2 Min | Zu lang, das Publikum wird ungeduldig |

Das Video zeigt **einen** Highlight-Moment (z. B. Live-Stream
mit `mosquitto_sub` läuft), nicht die ganze Demo.

## Warum `pg_dump` zusätzlich zu Timeshift

`pg_dump` ist ein **logischer** Backup, kein physischer:

- Lesbar (kann in ein anderes Postgres eingespielt werden)
- Versionierbar (kann in Git committet werden)
- Selektiv (man kann einzelne Tabellen restoren)
- Migrations-tauglich (passt sich Schema-Änderungen an)

**Timeshift** macht einen physischen Snapshot des Filesystems.
Wenn das Postgres-Schema-Version sich ändert, kann der Snapshot
inkompatibel sein.

**Beide zusammen** = maximale Sicherheit.

## Was bewusst NICHT in Tag 4 enthalten ist

- **K6-Last-Tests** (1000+ Sensoren) — out of scope
- **Chaos-Engineering** (zufällige Container-Kills) — zu komplex
- **Real-User-Monitoring** (z. B. Datadog) — Overkill
- **CDN / Edge-Caching** — irrelevant für lokales MQTT
- **Microservices-Aufteilung** — wir haben schon 4 Services,
  mehr ist Overkill

## Häufige Anfängerfehler (für Trainer-1:1-Coaching)

1. **"RAM sieht hoch aus"** — ohne Vergleichswert panikmachen.
   200 MB für ein Go-Backend mit Postgres-Pool ist normal.
2. **"Eine Message fehlt"** — QoS-1 Redelivery, normal. Nicht
   dramatisch ranken.
3. **"Tabelle ist 5 % langsamer"** — DB-Cache warm-up, nach
   5 Min wieder normal.
4. **"Live-curl crasht"** — oft einfach ein 404, kein Crash.
   Statuscode genau anschauen.
5. **"Backup-Video geht nicht"** — der Mime-Type passt nicht.
    Im Browser den Datei-Pfad prüfen.

## Lösungs-Varianten, die auch okay wären

- **Stress-Tests mit nur 2 Sensoren** statt 5 — Aussagekraft
  geringer, aber besser als kein Test
- **Manuelles Skript** statt Cronjob — funktioniert, aber
  fehleranfällig
- **30 Min statt 1 h Laufzeit** — weniger Vertrauen, geht
  schneller
- **Probe-Demo alleine im Team** statt vor der Klasse —
  weniger Lerneffekt

Alle sind **korrekt** für den Bootcamp.

## Siehe auch

- [stresstest-commands.md](stresstest-commands.md) – alle
  Stresstest-Befehle
- [demo-skript.md](demo-skript.md) – 5-7 Min Skript
- [backup-pflicht-skript.md](backup-pflicht-skript.md) –
  pg_dump + Snapshot
- [README.md](README.md) – Übersicht und Reihenfolge
