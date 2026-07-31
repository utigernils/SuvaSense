# SuvaSense Backend

Go backend for MQTT ingestion and REST read APIs.

## Local Run Without Go Installed

Use Docker Compose from the repository root.

1. Create env file for backend:

   Copy Backend/.env.example to Backend/.env and adjust values.

2. Recommended values for Docker Compose network:

- DATABASE_URL=postgres://suvasense:suvasense_secret@postgres:5432/suvasense?sslmode=disable
- MQTT_BROKER_URL=tcp://mosquitto:1883
- MQTT_TOPIC=suva/+/data

3. Start all services:

   docker compose up --build

4. API base URL:

   http://localhost:8080/api/v1

## Schema Bootstrap

On startup the backend checks if tables sensors and readings exist.
If one is missing, it executes schema.sql from DB_SCHEMA_PATH.

## Endpoints

- GET /health
- GET /api/v1/sensors
- GET /api/v1/sensors/{serial}
- GET /api/v1/sensors/{serial}/latest
- GET /api/v1/sensors/{serial}/readings/{sensorType}
- GET /api/v1/sensors/{serial}/readings/{sensorType}/latest

## Filtering and Pagination

List readings supports:

- page, page_size
- from, to (RFC3339)
- numeric range filters via suffix:
  - temp_c_min, temp_c_max
  - hum_pct_min, hum_pct_max
  - press_hpa_min, press_hpa_max
  - gas_kohm_min, gas_kohm_max
  - lux_min, lux_max
  - white_raw_min, white_raw_max
  - acc_x_min ... ang_z_max
  - cpu_temp_c_min, cpu_temp_c_max
  - free_heap_bytes_min, free_heap_bytes_max
  - rssi_dbm_min, rssi_dbm_max
