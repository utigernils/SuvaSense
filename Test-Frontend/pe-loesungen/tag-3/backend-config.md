# Tag 3 Referenz – Backend-Konfiguration

Das SuvaSense-Backend (Go-Service) liest seine Konfiguration
aus Umgebungsvariablen (12-Factor-App-Style). Diese Datei
dokumentiert alle unterstützten Variablen.

## Datei: `Backend/.env`

```bash
# === MQTT ===
# Hostname des MQTT-Brokers (in Docker: Service-Name)
MQTT_HOST=mosquitto

# Port (Standard 1883, TLS 8883)
MQTT_PORT=1883

# Optionale Auth (fuer Produktion)
# MQTT_USERNAME=suvasense
# MQTT_PASSWORD=<passwort>

# Topic-Filter (was subscriben wir)
MQTT_TOPIC_FILTER=suva/+/data

# QoS-Level (0, 1 oder 2)
MQTT_QOS=1

# === Postgres ===
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=suvasense
POSTGRES_USER=suvasense
POSTGRES_PASSWORD=<sicheres-passwort>

# Optional: SSL zur DB
# POSTGRES_SSLMODE=require
# POSTGRES_SSLROOTCERT=/path/to/ca.pem

# Connection-Pool
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=5m

# === HTTP Server ===
HTTP_PORT=8080
HTTP_READ_TIMEOUT=10s
HTTP_WRITE_TIMEOUT=10s

# === Logging ===
LOG_LEVEL=info          # debug, info, warn, error
LOG_FORMAT=json         # json oder text

# === API ===
# Optional: API-Key-Schutz (fuer Produktion)
# API_KEY_REQUIRED=true
# API_KEYS=<key1>,<key2>

# Optional: Rate-Limiting
# RATE_LIMIT_REQUESTS_PER_MINUTE=60

# === Misc ===
# Optional: Custom-Name fuer die Plattform
# PLATFORM_NAME=SuvaSense-Bootcamp-2026

# Sensortypen, die verarbeitet werden
# (Komma-getrennt, leere Liste = alle)
SENSOR_TYPES=
```

## Sensible Variablen (.env-Datei)

Die folgenden Variablen enthalten Secrets und müssen in der
`.env`-Datei bleiben (nicht im Klartext in `docker-compose.yml`):

- `POSTGRES_PASSWORD` – DB-Passwort
- `MQTT_PASSWORD` (optional) – MQTT-Auth-Passwort
- `API_KEYS` (optional) – API-Auth-Tokens

`docker-compose.yml` referenziert sie als `${POSTGRES_PASSWORD}`
etc. – Docker liest automatisch aus der `.env`.

## Standard-Werte (im Code)

Falls eine Variable nicht gesetzt ist, nutzt das Backend
folgende Defaults:

| Variable | Default |
|---|---|
| `MQTT_HOST` | `mosquitto` |
| `MQTT_PORT` | `1883` |
| `MQTT_TOPIC_FILTER` | `suva/+/data` |
| `MQTT_QOS` | `1` |
| `POSTGRES_HOST` | `postgres` |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_DB` | `suvasense` |
| `POSTGRES_USER` | `suvasense` |
| `DB_MAX_OPEN_CONNS` | `25` |
| `HTTP_PORT` | `8080` |
| `LOG_LEVEL` | `info` |
| `LOG_FORMAT` | `json` |

## Testen der Konfiguration

```bash
# Im Backend-Container
docker compose exec backend env | grep -E "MQTT|POSTGRES|LOG"

# Test-Message publishen
mosquitto_pub -h <debian-ip> -t suva/SN12345/data \
  -m '{"bme680":{"temp":23.4,"hum":51,"press":1013.2,"gas":145.6}}'

# Backend-Log live
docker compose logs -f backend
# Sollte zeigen: ingest ok serial=SN12345
```

## Häufige Probleme

| Fehler | Ursache | Lösung |
|---|---|---|
| `connection refused: postgres:5432` | Hostname falsch | `POSTGRES_HOST=postgres` (Service-Name), nicht `localhost` |
| `authentication failed for user suvasense` | Falsches Passwort | `.env` prüfen, `POSTGRES_PASSWORD` muss in `docker-compose.yml` mit `${...}` referenziert sein |
| `dial tcp: lookup mosquitto: no such host` | MQTT_HOST falsch | `MQTT_HOST=mosquitto` (Service-Name) |
| Backend verbindet MQTT, aber keine Messages | Topic-Filter falsch | `MQTT_TOPIC_FILTER=suva/+/data` |
| Backend schreibt nicht in DB | DB-Connection-Problem | `docker compose exec backend sh` und `psql` testen |

## Wichtige Hinweise zur .env-Datei

```bash
# Rechte setzen (nur Eigentümer darf lesen)
chmod 600 .env

# .env darf NIE in Git!
echo ".env" >> .gitignore
```

**Im .gitignore (im SuvaSense-Repo) sollte stehen:**

```
.env
*.env
.env.local
.env.production
```

**Im Notfall**, wenn die `.env` versehentlich committet wurde:
1. Passwort SOFORT ändern
2. Aus History entfernen: `git filter-repo --invert-paths
   --path .env` (oder `bfg-repo`)
3. Passwort in allen Services aktualisieren

## Siehe auch

- [docker-compose-prod.yml](docker-compose-prod.yml) – mit den
  Env-Referenzen
- [schema.sql](schema.sql) – Datenbank-Schema
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen