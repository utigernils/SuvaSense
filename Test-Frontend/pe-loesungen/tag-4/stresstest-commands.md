# Tag 4 Referenz – Stresstest-Befehle

Befehle, die du im Stresstest-Hands-on brauchst. Skript-artig
zusammengestellt, damit du sie kopieren und ausführen kannst.

## Vorbereitung: Test-Sensoren simulieren

Falls du nicht genug echte ESPs hast, simuliere die anderen mit
`mosquitto_pub`:

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

**Hinweis:** `-r` (retained) ist nur für **Test-Sensoren** OK.
Echte Sensoren nutzen `retained = false` (siehe
[mqtt-vertrag](../../../pe-raumklima-bootcamp/docs/projekt/mqtt-vertrag.md)).

## Live-Monitoring

```bash
# Alle Messages live (in einem Terminal)
mosquitto_sub -t 'suva/+/data' -v

# Backend-Log live (in einem anderen Terminal)
cd ~/SuvaSense
docker compose logs -f backend | grep -E "ingest|error|ERROR"

# Container-Ressourcen (in einem dritten Terminal)
docker stats

# Postgres-Connections
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT count(*) AS active_conns FROM pg_stat_activity;"
```

## DB-Metriken prüfen

```bash
# Total Readings (sollte mit Anzahl Messages wachsen)
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT COUNT(*) FROM readings;"

# Readings pro Sensor
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT s.serial_number, r.sensor_type, COUNT(*) AS readings
      FROM readings r
      JOIN sensors s ON r.sensor_id = s.id
      GROUP BY s.serial_number, r.sensor_type
      ORDER BY s.serial_number, r.sensor_type;"

# Container-RAM-Limit
docker stats --no-stream | grep backend

# Backend-RAM über Zeit (für die Demo)
docker stats --format "table {{.Container}}\t{{.MemUsage}}" --no-stream
```

## Verbindungsabbruch simulieren

**Test 1: Einen ESP kurz vom Strom**

1. Notiere aktuelle `last_seen_at` im pgAdmin
2. ESP aus der Steckdose ziehen
3. 30 Sekunden warten
4. ESP wieder einstecken
5. Warte 15 s (eine Publish-Periode)
6. Prüfe: ist `last_seen_at` neu?

```bash
# In pgAdmin Query Tool:
SELECT serial_number, last_seen_at, status
FROM sensors
WHERE serial_number = 'SN12345';
```

**Erwartung:** `last_seen_at` ist ~15 s alt. Status: `online`.

**Test 2: Broker neu starten**

```bash
# Broker stoppen
docker compose stop mosquitto

# Während des Stops: ESP publishen lassen (geht nicht, weil Broker fehlt)
# Aber: ESP speichert NICHTS lokal. Wenn Broker 5 s weg ist, fehlen
# 0-1 Messages. Wenn 30 s weg: 3 Messages verloren.

# Wieder starten
docker compose start mosquitto

# Backend log: werden die verpassten Messages nachgeholt?
docker compose logs --tail=50 backend
```

**Erwartung:** Wenn `persistence true` und Backend-Subscription
mit `clean session: false` → keine Messages verloren. Sonst:
Lücke.

## Backend-Restart

```bash
# Backend restarten
docker compose restart backend

# Logs live mitlesen
docker compose logs -f backend
# Sollte zeigen: backend_1  | [Init] Starting SuvaSense Backend
#                backend_1  | [MQTT] Connected to broker
#                backend_1  | [DB] Connected to postgres
```

**Erwartung:** Backend ist in ~5 s wieder verfügbar. Andere
Services laufen während des Restarts weiter.

## REST-API-Last testen

```bash
# 20 parallele Anfragen
SERIAL="SN12345"
for i in {1..20}; do
  curl -s "http://localhost:8080/api/v1/sensors/$SERIAL/readings?page=1&page_size=10" > /dev/null &
done
wait

# Dauer messen
time curl -s "http://localhost:8080/api/v1/sensors/$SERIAL/readings?page=1&page_size=10" > /dev/null
# Sollte < 100 ms sein
```

## 1-Stunden-Laufzeit

```bash
# Timer starten
echo "Stresstest gestartet um $(date)" | tee /tmp/stresstest.log

# Nach 1 Stunde:
# - Backend-RAM < 200 MB?
# - Postgres-Connections stabil?
# - DB-Counts wachsen kontinuierlich?
# - Keine Errors im Backend-Log?

# Schluss-Status
docker stats --no-stream
echo "Stresstest beendet um $(date)" | tee -a /tmp/stresstest.log
```

## Stresstest-Report-Vorlage

Für die Nachbereitung am Tag 5:

```markdown
## Stresstest-Report (PE-Team)

**Datum:** 11.08.2026
**Dauer:** XX Min
**Sensoren:** X (X echte + Y simulierte)

### Ergebnisse

| Metrik | Erwartet | Tatsächlich | OK? |
|---|---|---|---|
| Backend-RAM nach 30 Min | < 200 MB | XX MB | ✅/❌ |
| Anzahl Messages | X × 6 × 30 = XXX | XXX | ✅/❌ |
| REST-API Antwortzeit | < 100 ms | XX ms | ✅/❌ |
| Verbindungsabbrüche überlebt | ja | ja/nein | ✅/❌ |

### Probleme

1. ...
2. ...

### Lessons Learned

- ...
```

## Siehe auch

- [pe-raumklima-bootcamp/docs/tag-4/hands-on-stresstest.md](../../../pe-raumklima-bootcamp/docs/tag-4/hands-on-stresstest.md) – die offizielle Lernanleitung
- [demo-skript.md](demo-skript.md) – 5-7 Min Demo-Vorbereitung
- [backup-pflicht-skript.md](backup-pflicht-skript.md) – Snapshot + pg_dump
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen