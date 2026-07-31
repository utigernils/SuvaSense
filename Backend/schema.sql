CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text NOT NULL UNIQUE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_topic text NOT NULL,
  publish_interval_ms integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS readings (
  id bigserial PRIMARY KEY,
  sensor_id uuid NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  sensor_type text NOT NULL CHECK (sensor_type IN ('bme680', 'mpu6050', 'veml7700', 'system')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  device_uptime_s bigint,
  source_topic text NOT NULL,
  raw jsonb NOT NULL,

  temp_c double precision,
  hum_pct double precision,
  press_hpa double precision,
  gas_kohm double precision,

  lux double precision,
  white_raw double precision,

  acc_x double precision,
  acc_y double precision,
  acc_z double precision,
  gyro_x double precision,
  gyro_y double precision,
  gyro_z double precision,
  ang_x double precision,
  ang_y double precision,
  ang_z double precision,

  cpu_temp_c double precision,
  free_heap_bytes bigint,
  rssi_dbm integer
);

CREATE INDEX IF NOT EXISTS idx_sensors_last_seen_at ON sensors(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_sensor_type_recorded_at ON readings(sensor_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_sensor_id_type_recorded_at ON readings(sensor_id, sensor_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_recorded_at ON readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_raw_gin ON readings USING GIN (raw);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sensors_updated_at ON sensors;
CREATE TRIGGER trg_sensors_updated_at
BEFORE UPDATE ON sensors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
