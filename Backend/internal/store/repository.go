package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"SuvaSense_Backend/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) UpsertSensor(ctx context.Context, serial, topic string) (string, error) {
	const q = `
	INSERT INTO sensors (serial_number, first_seen_at, last_seen_at, last_topic)
	VALUES ($1, now(), now(), $2)
	ON CONFLICT (serial_number)
	DO UPDATE SET
		last_seen_at = EXCLUDED.last_seen_at,
		last_topic = EXCLUDED.last_topic
	RETURNING id;
	`

	var sensorID string
	if err := r.db.QueryRow(ctx, q, serial, topic).Scan(&sensorID); err != nil {
		return "", fmt.Errorf("upsert sensor: %w", err)
	}

	return sensorID, nil
}

func (r *Repository) InsertPayloadReadings(ctx context.Context, sensorID, topic string, payload domain.Payload) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if payload.BME680 != nil {
		raw, _ := json.Marshal(payload.BME680)
		if _, err := tx.Exec(ctx, `
			INSERT INTO readings (
				sensor_id, sensor_type, recorded_at, source_topic, raw,
				temp_c, hum_pct, press_hpa, gas_kohm
			) VALUES ($1, 'bme680', now(), $2, $3, $4, $5, $6, $7)
		`, sensorID, topic, raw, payload.BME680.Temp, payload.BME680.Hum, payload.BME680.Press, payload.BME680.Gas); err != nil {
			return fmt.Errorf("insert bme680 reading: %w", err)
		}
	}

	if payload.VEML7700 != nil {
		raw, _ := json.Marshal(payload.VEML7700)
		if _, err := tx.Exec(ctx, `
			INSERT INTO readings (
				sensor_id, sensor_type, recorded_at, source_topic, raw,
				lux, white_raw
			) VALUES ($1, 'veml7700', now(), $2, $3, $4, $5)
		`, sensorID, topic, raw, payload.VEML7700.Lux, payload.VEML7700.White); err != nil {
			return fmt.Errorf("insert veml7700 reading: %w", err)
		}
	}

	if payload.MPU6050 != nil {
		raw, _ := json.Marshal(payload.MPU6050)
		if _, err := tx.Exec(ctx, `
			INSERT INTO readings (
				sensor_id, sensor_type, recorded_at, source_topic, raw,
				acc_x, acc_y, acc_z,
				gyro_x, gyro_y, gyro_z,
				ang_x, ang_y, ang_z
			) VALUES (
				$1, 'mpu6050', now(), $2, $3,
				$4, $5, $6,
				$7, $8, $9,
				$10, $11, $12
			)
		`,
			sensorID, topic, raw,
			payload.MPU6050.Acc.X, payload.MPU6050.Acc.Y, payload.MPU6050.Acc.Z,
			payload.MPU6050.Gyro.X, payload.MPU6050.Gyro.Y, payload.MPU6050.Gyro.Z,
			payload.MPU6050.Ang.X, payload.MPU6050.Ang.Y, payload.MPU6050.Ang.Z,
		); err != nil {
			return fmt.Errorf("insert mpu6050 reading: %w", err)
		}
	}

	if payload.System != nil {
		raw, _ := json.Marshal(payload.System)
		if _, err := tx.Exec(ctx, `
			INSERT INTO readings (
				sensor_id, sensor_type, recorded_at, source_topic, raw,
				device_uptime_s,
				cpu_temp_c, free_heap_bytes, rssi_dbm
			) VALUES ($1, 'system', now(), $2, $3, $4, $5, $6, $7)
		`, sensorID, topic, raw, payload.System.Uptime, payload.System.CPUTemp, payload.System.FreeHeap, payload.System.RSSI); err != nil {
			return fmt.Errorf("insert system reading: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}

	return nil
}

func (r *Repository) ListSensors(ctx context.Context, page, pageSize int) ([]domain.Sensor, error) {
	offset := (page - 1) * pageSize
	const q = `
	SELECT id, serial_number, first_seen_at, last_seen_at, last_topic, publish_interval_ms, metadata, created_at, updated_at
	FROM sensors
	ORDER BY last_seen_at DESC
	LIMIT $1 OFFSET $2;
	`

	rows, err := r.db.Query(ctx, q, pageSize, offset)
	if err != nil {
		return nil, fmt.Errorf("query sensors: %w", err)
	}
	defer rows.Close()

	out := make([]domain.Sensor, 0, pageSize)
	for rows.Next() {
		var s domain.Sensor
		var metadata []byte
		if err := rows.Scan(
			&s.ID,
			&s.SerialNumber,
			&s.FirstSeenAt,
			&s.LastSeenAt,
			&s.LastTopic,
			&s.PublishMs,
			&metadata,
			&s.CreatedAt,
			&s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan sensor: %w", err)
		}
		if len(metadata) > 0 {
			_ = json.Unmarshal(metadata, &s.Metadata)
		}
		if s.Metadata == nil {
			s.Metadata = map[string]any{}
		}
		out = append(out, s)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("iterate sensors: %w", rows.Err())
	}

	return out, nil
}

func (r *Repository) GetSensorBySerial(ctx context.Context, serial string) (domain.Sensor, error) {
	const q = `
	SELECT id, serial_number, first_seen_at, last_seen_at, last_topic, publish_interval_ms, metadata, created_at, updated_at
	FROM sensors
	WHERE serial_number = $1;
	`

	var s domain.Sensor
	var metadata []byte
	if err := r.db.QueryRow(ctx, q, serial).Scan(
		&s.ID,
		&s.SerialNumber,
		&s.FirstSeenAt,
		&s.LastSeenAt,
		&s.LastTopic,
		&s.PublishMs,
		&metadata,
		&s.CreatedAt,
		&s.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Sensor{}, err
		}
		return domain.Sensor{}, fmt.Errorf("query sensor by serial: %w", err)
	}

	if len(metadata) > 0 {
		_ = json.Unmarshal(metadata, &s.Metadata)
	}
	if s.Metadata == nil {
		s.Metadata = map[string]any{}
	}

	return s, nil
}

func (r *Repository) GetLatestReadingForSensorType(ctx context.Context, serial, sensorType string) (domain.Reading, error) {
	if !domain.IsValidSensorType(sensorType) {
		return domain.Reading{}, fmt.Errorf("invalid sensor type: %s", sensorType)
	}

	const q = `
	SELECT
		r.id,
		r.sensor_id,
		s.serial_number,
		r.sensor_type,
		r.recorded_at,
		r.device_uptime_s,
		r.source_topic,
		r.raw,
		r.temp_c,
		r.hum_pct,
		r.press_hpa,
		r.gas_kohm,
		r.lux,
		r.white_raw,
		r.acc_x,
		r.acc_y,
		r.acc_z,
		r.gyro_x,
		r.gyro_y,
		r.gyro_z,
		r.ang_x,
		r.ang_y,
		r.ang_z,
		r.cpu_temp_c,
		r.free_heap_bytes,
		r.rssi_dbm
	FROM readings r
	JOIN sensors s ON s.id = r.sensor_id
	WHERE s.serial_number = $1 AND r.sensor_type = $2
	ORDER BY r.recorded_at DESC
	LIMIT 1;
	`

	row := r.db.QueryRow(ctx, q, serial, sensorType)
	return scanReading(row)
}

func (r *Repository) ListReadings(ctx context.Context, serial, sensorType string, filter domain.ReadingFilter) ([]domain.Reading, error) {
	if !domain.IsValidSensorType(sensorType) {
		return nil, fmt.Errorf("invalid sensor type: %s", sensorType)
	}

	query := strings.Builder{}
	args := make([]any, 0, 20)
	argPos := 1

	query.WriteString(`
	SELECT
		r.id,
		r.sensor_id,
		s.serial_number,
		r.sensor_type,
		r.recorded_at,
		r.device_uptime_s,
		r.source_topic,
		r.raw,
		r.temp_c,
		r.hum_pct,
		r.press_hpa,
		r.gas_kohm,
		r.lux,
		r.white_raw,
		r.acc_x,
		r.acc_y,
		r.acc_z,
		r.gyro_x,
		r.gyro_y,
		r.gyro_z,
		r.ang_x,
		r.ang_y,
		r.ang_z,
		r.cpu_temp_c,
		r.free_heap_bytes,
		r.rssi_dbm
	FROM readings r
	JOIN sensors s ON s.id = r.sensor_id
	WHERE s.serial_number = $1 AND r.sensor_type = $2
	`)
	args = append(args, serial, sensorType)
	argPos = 3

	if filter.From != nil {
		query.WriteString(fmt.Sprintf(" AND r.recorded_at >= $%d", argPos))
		args = append(args, *filter.From)
		argPos++
	}
	if filter.To != nil {
		query.WriteString(fmt.Sprintf(" AND r.recorded_at <= $%d", argPos))
		args = append(args, *filter.To)
		argPos++
	}

	allowedFields := allowedNumericFilters(sensorType)
	for field, v := range filter.FieldMins {
		if !allowedFields[field] {
			continue
		}
		query.WriteString(fmt.Sprintf(" AND r.%s >= $%d", field, argPos))
		args = append(args, v)
		argPos++
	}
	for field, v := range filter.FieldMaxs {
		if !allowedFields[field] {
			continue
		}
		query.WriteString(fmt.Sprintf(" AND r.%s <= $%d", field, argPos))
		args = append(args, v)
		argPos++
	}

	query.WriteString(" ORDER BY r.recorded_at DESC")
	query.WriteString(fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1))
	args = append(args, filter.PageSize, (filter.Page-1)*filter.PageSize)

	rows, err := r.db.Query(ctx, query.String(), args...)
	if err != nil {
		return nil, fmt.Errorf("query readings: %w", err)
	}
	defer rows.Close()

	out := make([]domain.Reading, 0, filter.PageSize)
	for rows.Next() {
		rec, err := scanReading(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, rec)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("iterate readings: %w", rows.Err())
	}

	return out, nil
}

func (r *Repository) ListAllReadings(ctx context.Context, serial string, sensorType *string, filter domain.ReadingFilter) ([]domain.Reading, error) {
	query := strings.Builder{}
	args := make([]any, 0, 20)
	argPos := 1

	query.WriteString(`
	SELECT
		r.id,
		r.sensor_id,
		s.serial_number,
		r.sensor_type,
		r.recorded_at,
		r.device_uptime_s,
		r.source_topic,
		r.raw,
		r.temp_c,
		r.hum_pct,
		r.press_hpa,
		r.gas_kohm,
		r.lux,
		r.white_raw,
		r.acc_x,
		r.acc_y,
		r.acc_z,
		r.gyro_x,
		r.gyro_y,
		r.gyro_z,
		r.ang_x,
		r.ang_y,
		r.ang_z,
		r.cpu_temp_c,
		r.free_heap_bytes,
		r.rssi_dbm
	FROM readings r
	JOIN sensors s ON s.id = r.sensor_id
	WHERE s.serial_number = $1
	`)
	args = append(args, serial)
	argPos = 2

	if sensorType != nil {
		query.WriteString(fmt.Sprintf(" AND r.sensor_type = $%d", argPos))
		args = append(args, *sensorType)
		argPos++
	}

	if filter.From != nil {
		query.WriteString(fmt.Sprintf(" AND r.recorded_at >= $%d", argPos))
		args = append(args, *filter.From)
		argPos++
	}
	if filter.To != nil {
		query.WriteString(fmt.Sprintf(" AND r.recorded_at <= $%d", argPos))
		args = append(args, *filter.To)
		argPos++
	}

	for field, v := range filter.FieldMins {
		if !allowedNumericFilters("")[field] {
			continue
		}
		query.WriteString(fmt.Sprintf(" AND r.%s >= $%d", field, argPos))
		args = append(args, v)
		argPos++
	}
	for field, v := range filter.FieldMaxs {
		if !allowedNumericFilters("")[field] {
			continue
		}
		query.WriteString(fmt.Sprintf(" AND r.%s <= $%d", field, argPos))
		args = append(args, v)
		argPos++
	}

	query.WriteString(" ORDER BY r.recorded_at DESC")
	query.WriteString(fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1))
	args = append(args, filter.PageSize, (filter.Page-1)*filter.PageSize)

	rows, err := r.db.Query(ctx, query.String(), args...)
	if err != nil {
		return nil, fmt.Errorf("query all readings: %w", err)
	}
	defer rows.Close()

	out := make([]domain.Reading, 0, filter.PageSize)
	for rows.Next() {
		rec, err := scanReading(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, rec)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("iterate all readings: %w", rows.Err())
	}

	return out, nil
}

func allowedNumericFilters(sensorType string) map[string]bool {
	base := map[string]bool{
		"device_uptime_s": true,
	}
	for k, v := range map[string]bool{
		"temp_c": true, "hum_pct": true, "press_hpa": true, "gas_kohm": true,
		"lux": true, "white_raw": true,
		"acc_x": true, "acc_y": true, "acc_z": true,
		"gyro_x": true, "gyro_y": true, "gyro_z": true,
		"ang_x": true, "ang_y": true, "ang_z": true,
		"cpu_temp_c": true, "free_heap_bytes": true, "rssi_dbm": true,
	} {
		base[k] = v
	}
	_ = sensorType
	return base
}

func scanReading(row pgx.Row) (domain.Reading, error) {
	var rec domain.Reading
	var raw []byte

	if err := row.Scan(
		&rec.ID,
		&rec.SensorID,
		&rec.SerialNumber,
		&rec.SensorType,
		&rec.RecordedAt,
		&rec.DeviceUptime,
		&rec.SourceTopic,
		&raw,
		&rec.TempC,
		&rec.HumPct,
		&rec.PressHpa,
		&rec.GasKohm,
		&rec.Lux,
		&rec.WhiteRaw,
		&rec.AccX,
		&rec.AccY,
		&rec.AccZ,
		&rec.GyroX,
		&rec.GyroY,
		&rec.GyroZ,
		&rec.AngX,
		&rec.AngY,
		&rec.AngZ,
		&rec.CPUTempC,
		&rec.FreeHeapBytes,
		&rec.RSSIDbm,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Reading{}, err
		}
		return domain.Reading{}, fmt.Errorf("scan reading: %w", err)
	}

	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &rec.Raw); err != nil {
			return domain.Reading{}, fmt.Errorf("decode reading raw json: %w", err)
		}
	}

	if rec.Raw == nil {
		rec.Raw = map[string]any{}
	}

	return rec, nil
}

func (r *Repository) GetLatestByType(ctx context.Context, serial string) (map[string]domain.Reading, error) {
	out := map[string]domain.Reading{}
	sensorTypes := []string{"bme680", "mpu6050", "veml7700", "system"}

	for _, sensorType := range sensorTypes {
		rec, err := r.GetLatestReadingForSensorType(ctx, serial, sensorType)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				continue
			}
			return nil, err
		}
		out[sensorType] = rec
	}

	return out, nil
}

func (r *Repository) CountReadingsByType(ctx context.Context, serial string) (map[string]int64, error) {
	const q = `
	SELECT r.sensor_type, COUNT(*)::bigint
	FROM readings r
	JOIN sensors s ON s.id = r.sensor_id
	WHERE s.serial_number = $1
	GROUP BY r.sensor_type;
	`

	rows, err := r.db.Query(ctx, q, serial)
	if err != nil {
		return nil, fmt.Errorf("count readings by type: %w", err)
	}
	defer rows.Close()

	out := map[string]int64{}
	for rows.Next() {
		var sensorType string
		var count int64
		if err := rows.Scan(&sensorType, &count); err != nil {
			return nil, fmt.Errorf("scan reading count: %w", err)
		}
		out[sensorType] = count
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("iterate reading counts: %w", rows.Err())
	}

	return out, nil
}

func ComputeStatus(lastSeenAt time.Time, thresholdSec int) string {
	if time.Since(lastSeenAt) <= time.Duration(thresholdSec)*time.Second {
		return "online"
	}
	return "offline"
}
