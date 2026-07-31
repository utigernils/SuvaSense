package domain

import "time"

type SensorType string

const (
	SensorTypeBME680   SensorType = "bme680"
	SensorTypeMPU6050  SensorType = "mpu6050"
	SensorTypeVEML7700 SensorType = "veml7700"
	SensorTypeSystem   SensorType = "system"
)

func IsValidSensorType(v string) bool {
	switch SensorType(v) {
	case SensorTypeBME680, SensorTypeMPU6050, SensorTypeVEML7700, SensorTypeSystem:
		return true
	default:
		return false
	}
}

type Payload struct {
	MPU6050  *MPU6050Payload  `json:"mpu6050"`
	VEML7700 *VEML7700Payload `json:"veml7700"`
	BME680   *BME680Payload   `json:"bme680"`
	System   *SystemPayload   `json:"system"`
}

type Vec3 struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type MPU6050Payload struct {
	Acc  Vec3 `json:"acc"`
	Gyro Vec3 `json:"gyro"`
	Ang  Vec3 `json:"ang"`
}

type VEML7700Payload struct {
	Lux   float64 `json:"lux"`
	White float64 `json:"white"`
}

type BME680Payload struct {
	Temp  float64 `json:"temp"`
	Hum   float64 `json:"hum"`
	Press float64 `json:"press"`
	Gas   float64 `json:"gas"`
}

type SystemPayload struct {
	Uptime   int64   `json:"uptime"`
	CPUTemp  float64 `json:"cpu_temp"`
	FreeHeap int64   `json:"free_heap"`
	RSSI     *int    `json:"rssi,omitempty"`
}

type Sensor struct {
	ID             string         `json:"id"`
	SerialNumber   string         `json:"serial_number"`
	FirstSeenAt    time.Time      `json:"first_seen_at"`
	LastSeenAt     time.Time      `json:"last_seen_at"`
	LastTopic      string         `json:"last_topic"`
	PublishMs      *int           `json:"publish_interval_ms,omitempty"`
	Metadata       map[string]any `json:"metadata"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	Status         string         `json:"status,omitempty"`
	LatestByType   map[string]any `json:"latest_by_type,omitempty"`
	ReadingsByType map[string]int64 `json:"readings_by_type,omitempty"`
}

type Reading struct {
	ID           int64          `json:"id"`
	SensorID     string         `json:"sensor_id"`
	SerialNumber string         `json:"serial_number"`
	SensorType   string         `json:"sensor_type"`
	RecordedAt   time.Time      `json:"recorded_at"`
	DeviceUptime *int64         `json:"device_uptime_s,omitempty"`
	SourceTopic  string         `json:"source_topic"`
	Raw          map[string]any `json:"raw"`

	TempC         *float64 `json:"temp_c,omitempty"`
	HumPct        *float64 `json:"hum_pct,omitempty"`
	PressHpa      *float64 `json:"press_hpa,omitempty"`
	GasKohm       *float64 `json:"gas_kohm,omitempty"`
	Lux           *float64 `json:"lux,omitempty"`
	WhiteRaw      *float64 `json:"white_raw,omitempty"`
	AccX          *float64 `json:"acc_x,omitempty"`
	AccY          *float64 `json:"acc_y,omitempty"`
	AccZ          *float64 `json:"acc_z,omitempty"`
	GyroX         *float64 `json:"gyro_x,omitempty"`
	GyroY         *float64 `json:"gyro_y,omitempty"`
	GyroZ         *float64 `json:"gyro_z,omitempty"`
	AngX          *float64 `json:"ang_x,omitempty"`
	AngY          *float64 `json:"ang_y,omitempty"`
	AngZ          *float64 `json:"ang_z,omitempty"`
	CPUTempC      *float64 `json:"cpu_temp_c,omitempty"`
	FreeHeapBytes *int64   `json:"free_heap_bytes,omitempty"`
	RSSIDbm       *int     `json:"rssi_dbm,omitempty"`
}

type ReadingPush struct {
	SerialNumber string             `json:"serial_number"`
	RecordedAt   time.Time          `json:"recorded_at"`
	SourceTopic  string             `json:"source_topic,omitempty"`
	Readings     map[string]Reading `json:"readings"`
}

type ReadingFilter struct {
	From      *time.Time
	To        *time.Time
	Page      int
	PageSize  int
	FieldMins map[string]float64
	FieldMaxs map[string]float64
}
