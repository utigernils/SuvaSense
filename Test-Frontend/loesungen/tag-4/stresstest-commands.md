# Stresstest – Alle Befehle (Trainer-Referenz)

Konsolidierte, kommentierte Sammlung **aller Befehle**, die du
am Tag 4 brauchst. Kann 1:1 abgetippt werden.

## Vorbereitung (5 Min)

```bash
# 1. In den SuvaSense-Stack-Ordner wechseln
cd ~/SuvaSense

# 2. Container-Status prüfen
docker compose ps
# Erwartet: 4 Services "running" (backend, mosquitto, postgres, pgadmin)

# 3. Health-Check
curl http://localhost:8080/health
# Erwartet: 200 OK

# 4. Aktuelle Anzahl Readings in der DB
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT COUNT(*) FROM readings;"
# Notieren als Baseline.
```

## Test-Sensoren simulieren (5 Min)

Falls du nicht genug echte ESPs hast, simuliere mit
`mosquitto_pub`. In je einem Terminal:

```bash
# Terminal 1: Sensor 1
mosquitto_pub -t suva/SIM-001/data -r -m \
  '{"bme680":{"temp":22.5,"hum":50,"press":1013,"gas":145}}'

# Terminal 2: Sensor 2
mosquitto_pub -t suva/SIM-002/data -r -m \
  '{"bme680":{"temp":17.8,"hum":68,"press":1015,"gas":160}}'

# Terminal 3: Sensor 3
mosquitto_pub -t suva/SIM-003/data -r -m \
  '{"bme680":{"temp":25.3,"hum":42,"press":1010,"gas":130}}'
```

`-r` (retained) ist nur für Test-Sensoren OK. Echte Sensoren
nutzen `retained = false`.

## Live-Monitoring (parallel zu allem)

```bash
# Terminal A: MQTT-Traffic beobachten
mosquitto_sub -t 'suva/+/data' -v

# Terminal B: Backend-Logs
cd ~/SuvaSense && docker compose logs -f backend | grep -E "ingest|error"

# Terminal C: Container-Ressourcen
docker stats --no-stream

# Terminal D: Postgres-Connections
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT count(*) AS active_conns FROM pg_stat_activity;"
```

## Datenbank-Metriken prüfen

```bash
# Total Readings (sollte kontinuierlich wachsen)
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT COUNT(*) FROM readings;"

# Readings pro Sensor
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT s.serial_number, r.sensor_type, COUNT(*) AS readings
      FROM readings r
      JOIN sensors s ON r.sensor_id = s.id
      GROUP BY s.serial_number, r.sensor_type
      ORDER BY s.serial_number, r.sensor_type;"

# Storage-Größe pro Tabelle
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS total
      FROM pg_class
      WHERE relname IN ('sensors', 'readings')
      ORDER BY pg_total_relation_size(relid) DESC;"
```

## Verbindungsabbruch simulieren

```bash
# ESP aus der Steckdose (oder WLAN deaktivieren)
# → Beobachte: 'mosquitto_sub' zeigt Lücke
# → Beobachte: 'docker logs backend' zeigt keine Errors
# → Beobachte: 'pg_stat_activity' zeigt weiterhin <5 Connections

# 30 Sekunden warten, ESP wieder einstecken
# → Beobachte: 'mosquitto_sub' zeigt wieder Messages
# → Erwartung: keine doppelten Einträge in DB (ON CONFLICT)
```

## Backend-Restart simulieren

```bash
# Backend neu starten
cd ~/SuvaSense
docker compose restart backend

# Logs mitlesen
docker compose logs -f backend
# Erwartung: "Connected to broker", "Connected to postgres"

# Erwartung: Mosquitto puffert Messages im RAM
# Wenn ein Sensor in der Zwischenzeit publishen wollte,
# erscheint die Message nach Backend-Neustart
```

## REST-API-Last testen

```bash
# 20 parallele Anfragen
SERIAL="SN12345"
for i in {1..20}; do
  curl -s "http://localhost:8080/api/v1/sensors/$SERIAL/readings?page=1&page_size=10" > /dev/null &
done
wait

# Dauer einer einzelnen Anfrage
time curl -s "http://localhost:8080/api/v1/sensors/$SERIAL/readings?page=1&page_size=10" > /dev/null
# Erwartung: < 100 ms
```

## 1-Stunden-Laufzeit-Timer

```bash
# Start-Zeit loggen
echo "Stresstest gestartet um $(date)" | tee /tmp/stresstest.log

# ... (1 Stunde laufen lassen) ...

# End-Status
docker stats --no-stream
echo "Stresstest beendet um $(date)" | tee -a /tmp/stresstest.log
```

## Container- und Volume-Snapshot

```bash
# 1. pg_dump der DB (vor Tag 4 Demo)
BACKUP_FILE="/tmp/suvasense-backup-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec -T postgres pg_dump -U suvasense suvasense > $BACKUP_FILE
gzip $BACKUP_FILE
ls -lh ${BACKUP_FILE}.gz

# 2. Timeshift-Snapshot der Debian-Box
sudo timeshift --create --comments "Vor Tag 4 Demo"
```

## Häufige Fehler (Diagnose)

| Fehler | Ursache | Lösung |
|---|---|---|
| `Cannot connect to broker` | Mosquitto down | `docker compose ps mosquitto`, dann `restart` |
| `Database connection refused` | Postgres nicht ready | `docker compose ps postgres`, warten bis `healthy` |
| `Readings werden nicht persistiert` | `ON CONFLICT` greift | Check `device_uptime_s` im Payload |
| `Memory wächst kontinuierlich` | Backend-Memory-Leak | `docker compose restart backend` |
| `REST 500` | Backend-Stack-Trace | `docker compose logs backend --tail=50` |

## Snapshot der VM (Debian-Box)

```bash
# Falls Timeshift nicht verfügbar, nutze das Debian-Standard-Tool
sudo apt install -y timeshift
sudo timeshift --create --comments "Stresstest-Stand Tag 4"
```
