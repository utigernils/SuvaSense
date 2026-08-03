# Tag 3 Referenz – Datenbank-Schema

Vollständiges SQL-Schema für die SuvaSense-Datenbank. Wird beim
ersten Start des Postgres-Containers automatisch ausgeführt (über
`/docker-entrypoint-initdb.d/` oder manuell via `psql`).

## Datei: `schema.sql` (im Backend-Verzeichnis)

```sql
-- ============================================================
-- SuvaSense Database Schema
-- ============================================================
--
-- Wird beim ersten Start des Postgres-Containers
-- automatisch ausgefuehrt.
--
-- Aenderungen: Neue Tabelle oder Spalte hinzufuegen,
-- dann ALTER TABLE statt CREATE TABLE (sonst startet
-- Postgres nicht neu, wenn die DB schon existiert).
-- ============================================================

-- Sensoren-Tabelle: jeder bekannte Sensor
CREATE TABLE IF NOT EXISTS sensors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number       TEXT UNIQUE NOT NULL,
    first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_topic          TEXT,
    publish_interval_ms INTEGER,
    metadata            JSONB DEFAULT '{}'::jsonb,
    status              TEXT DEFAULT 'unknown',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index fuer schnelle Lookups nach Seriennummer
CREATE INDEX IF NOT EXISTS idx_sensors_serial ON sensors(serial_number);

-- Readings-Tabelle: jede einzelne Messung
CREATE TABLE IF NOT EXISTS readings (
    id              BIGSERIAL PRIMARY KEY,
    sensor_id       UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    sensor_type     TEXT NOT NULL,
    recorded_at     TIMESTAMPTZ NOT NULL,
    device_uptime_s BIGINT,
    source_topic    TEXT,
    raw             JSONB NOT NULL,

    -- Typisierte Spalten pro Sensortyp
    temp_c          DOUBLE PRECISION,  -- bme680
    hum_pct         INTEGER,           -- bme680
    press_hpa       DOUBLE PRECISION,  -- bme680
    gas_kohm        DOUBLE PRECISION,  -- bme680

    lux             DOUBLE PRECISION,  -- veml7700
    white_raw       DOUBLE PRECISION,  -- veml7700

    cpu_temp_c      DOUBLE PRECISION,  -- system
    free_heap_bytes BIGINT,            -- system
    rssi_dbm        INTEGER,           -- system

    -- mpu6050 (falls vorhanden)
    acc_x           DOUBLE PRECISION,
    acc_y           DOUBLE PRECISION,
    acc_z           DOUBLE PRECISION,
    gyro_x          DOUBLE PRECISION,
    gyro_y          DOUBLE PRECISION,
    gyro_z          DOUBLE PRECISION,
    ang_x           DOUBLE PRECISION,
    ang_y           DOUBLE PRECISION,
    ang_z           DOUBLE PRECISION,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index fuer schnelle Lookups pro Sensor
CREATE INDEX IF NOT EXISTS idx_readings_sensor_id ON readings(sensor_id);

-- Index fuer zeitbasierte Queries (z. B. "letzte 10")
CREATE INDEX IF NOT EXISTS idx_readings_recorded_at
    ON readings(recorded_at DESC);

-- Composite-Index fuer Push-Bundle-Queries
CREATE INDEX IF NOT EXISTS idx_readings_sensor_recorded
    ON readings(sensor_id, recorded_at DESC);

-- UNIQUE-Constraint: keine doppelten Eintraege
-- bei QoS-1-Redelivery
CREATE UNIQUE INDEX IF NOT EXISTS idx_readings_unique
    ON readings(sensor_id, sensor_type, recorded_at, device_uptime_s);

-- Trigger: updated_at automatisch setzen
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sensors_updated_at
    BEFORE UPDATE ON sensors
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();
```

## Init-Script-Pfad

Im `docker-compose.yml` muss `schema.sql` gemountet werden:

```yaml
postgres:
  volumes:
    # Init-Skripte werden beim ersten Container-Start
    # einmalig ausgefuehrt (in alphabetischer Reihenfolge)
    - ./Backend/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
```

**Wichtig:** Init-Skripte werden **nur** beim ersten Start
ausgeführt (wenn das Volume leer ist). Bei einem bestehenden
Volume werden sie **ignoriert**.

**Wenn du das Schema ändern willst:**

1. Container stoppen: `docker compose stop postgres`
2. Volume prüfen: `docker volume inspect suvasense_postgres_data`
3. Volume NICHT löschen (Daten weg!)
4. Schema-Änderungen manuell mit `psql` oder pgAdmin
5. Alternativ: `docker compose down && docker volume rm
   suvasense_postgres_data` (Daten weg, dann `up` neu)

## Schema-Beispiele (Queries)

```sql
-- Aktive Sensoren mit letzter Aktivitaet
SELECT serial_number, last_seen_at, status
FROM sensors
WHERE status = 'online'
ORDER BY last_seen_at DESC
LIMIT 10;

-- Letzte 10 Readings eines Sensors
SELECT r.sensor_type, r.temp_c, r.hum_pct, r.recorded_at
FROM readings r
JOIN sensors s ON r.sensor_id = s.id
WHERE s.serial_number = 'SN12345'
ORDER BY r.recorded_at DESC
LIMIT 10;

-- Statistik pro Sensor-Typ
SELECT s.serial_number,
       r.sensor_type,
       COUNT(*) AS readings,
       MIN(r.recorded_at) AS first,
       MAX(r.recorded_at) AS last,
       AVG(r.temp_c) AS avg_temp,
       AVG(r.hum_pct) AS avg_hum
FROM readings r
JOIN sensors s ON r.sensor_id = s.id
WHERE r.recorded_at > NOW() - INTERVAL '1 hour'
GROUP BY s.serial_number, r.sensor_type
ORDER BY s.serial_number, r.sensor_type;

-- Storage-Groesse pro Tabelle
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_class
WHERE relname IN ('sensors', 'readings')
ORDER BY pg_total_relation_size(relid) DESC;
```

## Häufige Probleme

??? failure "Postgres startet nicht: 'permission denied'"
    Volume-Owner falsch. `docker compose down && sudo chown -R
    999:999 postgres-data/` (999 ist der postgres-User im
    Container).

??? failure "Schema nicht angewendet"
    Init-Skripte werden NUR beim ersten Start ausgefuehrt. Wenn
    das Volume schon Daten hat: manuell mit `psql` oder pgAdmin
    das Schema anwenden.

??? failure "Tabelle 'sensors' existiert nicht"
    Wahrscheinlich wurde das Schema-Skript nicht gemountet
    oder das Format ist falsch. Pruefen mit:
    `docker compose exec postgres ls /docker-entrypoint-initdb.d/`

??? failure "Doppelte Eintraege in readings"
    Der UNIQUE-Constraint greift nicht. Wahrscheinlich
    unterschiedliche `device_uptime_s`-Werte. Loesung: QoS-1
    Redelivery in Kauf nehmen, oder Constraint verschärfen.

## Siehe auch

- [docker-compose-prod.yml](docker-compose-prod.yml) – mit der
  Postgres-Config
- [backend-config.md](backend-config.md) – Backend-Env
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen