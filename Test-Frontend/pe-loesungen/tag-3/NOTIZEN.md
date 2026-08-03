# Notizen zu Tag 3 – PE-Lösungen

Diese Notizen erklären die **Design-Entscheidungen** hinter der
Referenz-Implementierung. Lies sie **nachdem** du dein eigenes
Coaching vorbereitet hast.

## Warum Postgres und nicht MySQL, MongoDB, InfluxDB?

| Alternative | Vorteil | Warum nicht? |
|---|---|---|
| **PostgreSQL 16** ✅ | Robust, JSONB, etabliert, frei | – |
| MySQL | Ähnlich, verbreitet | JSONB ist Postgres besser |
| MongoDB | Schemalos | Schemaless ist für strukturierte Daten overkill |
| InfluxDB | Time-Series optimiert | Spezialisiert, Migration später komplex |
| TimescaleDB | Postgres-Erweiterung | Zu komplex für Bootcamp |
| SQLite | Eingebettet | Single-Writer, nicht skalierbar |

**Postgres** ist die **sichere Wahl**:
- Seit 25+ Jahren etabliert
- JSONB ermöglicht flexible Sensordaten ohne Schema-Migration
- ACID-konform (wichtig für konsistente Persistenz)
- Tools: `psql`, pgAdmin, vollständiges Ökosystem
- Lizenz: BSD, komplett offen

## Warum JSONB für Sensordaten?

Sensoren liefern **heterogene Felder**:
- BME680: `temp`, `hum`, `press`, `gas`
- VEML7700: `lux`, `white`
- MPU6050: `acc.{x,y,z}`, `gyro.{x,y,z}`, `ang.{x,y,z}`

**Drei Optionen:**

| Ansatz | Vorteil | Nachteil |
|---|---|---|
| 1 Tabelle pro Sensortyp | Stark typisiert | 3+ Tabellen, viele Joins |
| 1 Tabelle mit allen Spalten | Eine Tabelle | Sparse Data, NULL-Soup |
| **1 Tabelle mit JSONB** ✅ | Eine Tabelle, flexibel | Typen muss Code prüfen |

Wir nutzen **Hybrid**: typisierte Spalten für die
häufigsten Filter (z. B. `temp_c` für "alle Sensoren über
25 °C"), plus `raw JSONB` für die kompletten Original-Daten
(für Anwendungsfälle, die wir noch nicht kennen).

## Warum Upsert mit ON CONFLICT?

Pro MQTT-Message wird der Sensor in `sensors` **upserted**
(INSERT or UPDATE):

```sql
INSERT INTO sensors (serial_number, ...) VALUES (...)
ON CONFLICT (serial_number) DO UPDATE
SET last_seen_at = NOW(), status = 'online';
```

**Warum:**
- Erste Message: Sensor wird neu angelegt
- Spätere Messages: nur `last_seen_at` und `status` werden
  aktualisiert
- Kein SELECT + INSERT (race conditions)
- Atomar in einer Query

## Warum UNIQUE-Constraint auf (sensor_id, sensor_type, recorded_at, device_uptime_s)?

QoS 1 in MQTT kann **doppelte Zustellung** verursachen (Broker
retried bei Verbindungsabbruch). Ohne Constraint hätten wir
doppelte Einträge in `readings`.

**Der Constraint verhindert das** – die zweite INSERT schlägt
fehl, das Backend loggt eine Warnung, und die Anzeige ist
trotzdem korrekt.

**Warum `device_uptime_s` und nicht nur `recorded_at`?**
- Zwei Sensoren können **gleichzeitig** (gleiche `recorded_at`)
  publishen
- `device_uptime_s` ist pro Sensor eindeutig (ESP32-Uptime)
- Zusammen mit `sensor_id` und `sensor_type` ist der Constraint
  praktisch eindeutig

## Warum 4 Services und nicht 1 monolithischer?

| Service | Aufgabe | Failure-Isolation |
|---|---|---|
| `backend` | REST-API + MQTT-Subscriber | Crash crasht nur API, Broker läuft |
| `mosquitto` | MQTT-Broker | Crash crasht nur MQTT, DB läuft |
| `postgres` | DB | Crash crasht nur DB, API gibt 500 |
| `pgadmin` | DB-Web-UI | Optional, kann crashen ohne Auswirkung |

**Vorteile:**
- Skalierung: Mosquitto kann auf einem separaten Host laufen
- Debugging: Logs pro Service isoliert
- Security: Postgres hat KEINEN Host-Port (nur im Docker-Netz)

**Nachteile:**
- Mehr Komplexität beim Setup
- Mehr Container zu überwachen

Für den Bootcamp: Komplexität ist akzeptabel, weil Lernende die
Schichten einzeln debuggen können.

## Warum Healthcheck nur für Postgres?

```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U suvasense -d suvasense"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s
```

- `start_period: 30s` – Postgres braucht ~10–20 s zum Starten
- Backend hat `depends_on: postgres: condition: service_healthy`
  → wartet, bis Postgres ready ist
- Mosquitto braucht keinen Healthcheck (startet sofort)
- Backend hat keinen Healthcheck (wird vom Frontend geprüft)

## Warum kein TLS im Bootcamp?

**TLS im Bootcamp-LAN:**
- ❌ Overhead: 2 s TLS-Handshake pro MQTT-Verbindung
- ❌ Zertifikate müssen verteilt werden (PKI)
- ❌ WireShark-Debugging komplizierter

**TLS für Produktion:**
- ✅ Notwendig, wenn Broker öffentlich erreichbar
- ✅ Selbstsignierte Zertifikate für interne CA
- ✅ Let's Encrypt für öffentlich erreichbare Domains

**Im Bootcamp:** `tcp://` ist ausreichend, das LAN ist isoliert.

## Warum alpine-Images (postgres:16-alpine)?

| Image | Größe | Startup |
|---|---|---|
| `postgres:16` | ~140 MB | ~8 s |
| `postgres:16-alpine` | ~80 MB | ~5 s |
| `postgres:16-slim` | ~80 MB | ~6 s |

Alpine-Images basieren auf Alpine Linux (musl libc, busybox).
**Kleiner, schneller, weniger Angriffsfläche.** Perfekt für
Container.

**Nachteil:** Manche nativen Extensions sind nicht verfügbar
(z. B. `postgis`). Für den Bootcamp irrelevant.

## Warum keine Backup-Strategie im Bootcamp-Container?

`pg_dump` ist ausserhalb des Containers einfacher:

```bash
docker compose exec -T postgres pg_dump -U suvasense suvasense > backup.sql
```

Im Container wäre es:

```bash
docker run --rm -v suvasense_postgres_data:/data \
    postgres:16-alpine pg_dump -U suvasense suvasense > backup.sql
```

Komplizierter, kein Mehrwert. **Im Bootcamp:** Trainer macht
einmal am Tag ein `pg_dump` und legt es auf einem USB-Stick ab.

## Was bewusst NICHT in der Referenz steht

- **TLS** – siehe oben
- **API-Key-Authentifizierung** – Bootcamp-LAN ist isoliert
- **Rate-Limiting** – nicht relevant fürs Bootcamp
- **Connection-Pooling-Tuning** – Default-Werte reichen
- **Read-Replicas** – zu komplex
- **Schema-Migrations-Tool** (z. B. Flyway) – wir machen
  manuelle ALTER TABLE

## Häufige Anfängerfehler beim 1:1-Coaching

1. **"Mein Backend kann die DB nicht erreichen"** – Hostname
   ist `localhost` statt `postgres`. Docker-DNS!
2. **"Mein INSERT schlägt fehl"** – oft ein Constraint-Konflikt
   (z. B. doppelte `(serial_number)` oder `(sensor_id, sensor_type, ...)`)
3. **"Mein pgAdmin zeigt nichts"** – Postgres-Container noch
   nicht ready (Healthcheck abwarten)
4. **"Mein Container restartet ständig"** – meistens fehlende
   Env-Variable oder falsche Volume-Pfade

## Lösungs-Varianten, die auch okay wären

- MySQL statt Postgres (aber JSONB ist schlechter)
- MQTT-Broker mit eingebauter Persistenz (HiveMQ, VerneMQ)
  statt separater Mosquitto-Container
- Andere Volume-Strategie (z. B. NFS-Mount statt Docker-Volume)
- Migration-Tool (Flyway, Liquibase) statt manueller SQL

Alle sind **korrekt**, solange das Topic-Schema stabil bleibt
und die REST-API funktioniert.

## Siehe auch

- [docker-compose-prod.yml](docker-compose-prod.yml) – mit
  Kommentaren
- [schema.sql](schema.sql) – Datenbank-Schema
- [backend-config.md](backend-config.md) – Env-Variables
- [pe-raumklima-bootcamp/docs/projekt/architektur.md](../../../pe-raumklima-bootcamp/docs/projekt/architektur.md) – 4-Schichten-Architektur