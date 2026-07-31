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
- GET /api/v1/sensors/{serial}/readings
- GET /api/v1/sensors/{serial}/readings/{sensorType}
- GET /api/v1/sensors/{serial}/readings/{sensorType}/latest

## Sensor Types

Allowed values for {sensorType} are:

- bme680
- mpu6050
- veml7700
- system

Defined in code at Backend/internal/domain/types.go via IsValidSensorType.

## All Readings (Formatted + Filterable)

Use this endpoint for all readings of one sensor type for one device:

- GET /api/v1/sensors/{serial}/readings/{sensorType}

Use this endpoint for all readings of a device across all sensor types:

- GET /api/v1/sensors/{serial}/readings

This returns items in the same structured format as latest, but paginated and filterable.

Examples:

- Latest only:
   - GET /api/v1/sensors/SN12345/readings/bme680/latest
- All BME680 readings, newest first:
   - GET /api/v1/sensors/SN12345/readings/bme680?page=1&page_size=100
- All readings (mixed sensor types), newest first:
   - GET /api/v1/sensors/SN12345/readings?page=1&page_size=100
- All readings, but only one sensor type via query filter:
   - GET /api/v1/sensors/SN12345/readings?sensor_type=bme680&page=1&page_size=100
- Time-window filtered:
   - GET /api/v1/sensors/SN12345/readings/bme680?from=2026-07-31T00:00:00Z&to=2026-07-31T23:59:59Z
- Numeric filter (temperature range):
   - GET /api/v1/sensors/SN12345/readings/bme680?temp_c_min=20&temp_c_max=30
- Numeric filter (RSSI on system telemetry):
   - GET /api/v1/sensors/SN12345/readings/system?rssi_dbm_min=-75

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
