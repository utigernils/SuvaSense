package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	HTTP HTTPConfig
	DB   DBConfig
	MQTT MQTTConfig
}

type HTTPConfig struct {
	Host string
	Port int
}

type DBConfig struct {
	URL        string
	SchemaPath string
}

type MQTTConfig struct {
	BrokerURL          string
	ClientID           string
	Username           string
	Password           string
	Topic              string
	QOS                byte
	ConnectTimeout     time.Duration
	ReconnectInterval  time.Duration
	OnlineThresholdSec int
}

func Load() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		HTTP: HTTPConfig{
			Host: getEnv("HTTP_HOST", "0.0.0.0"),
			Port: getEnvInt("HTTP_PORT", 8080),
		},
		DB: DBConfig{
			URL:        getEnv("DATABASE_URL", "postgres://suvasense:suvasense_secret@localhost:5432/suvasense?sslmode=disable"),
			SchemaPath: getEnv("DB_SCHEMA_PATH", "./schema.sql"),
		},
		MQTT: MQTTConfig{
			BrokerURL:          getEnv("MQTT_BROKER_URL", "tcp://localhost:1883"),
			ClientID:           getEnv("MQTT_CLIENT_ID", "suvasense-backend"),
			Username:           getEnv("MQTT_USERNAME", ""),
			Password:           getEnv("MQTT_PASSWORD", ""),
			Topic:              getEnv("MQTT_TOPIC", "suva/+/data"),
			QOS:                byte(getEnvInt("MQTT_QOS", 1)),
			ConnectTimeout:     time.Duration(getEnvInt("MQTT_CONNECT_TIMEOUT_SEC", 10)) * time.Second,
			ReconnectInterval:  time.Duration(getEnvInt("MQTT_RECONNECT_INTERVAL_SEC", 5)) * time.Second,
			OnlineThresholdSec: getEnvInt("SENSOR_ONLINE_THRESHOLD_SEC", 30),
		},
	}

	if cfg.HTTP.Port <= 0 || cfg.HTTP.Port > 65535 {
		return Config{}, fmt.Errorf("invalid HTTP_PORT: %d", cfg.HTTP.Port)
	}
	if cfg.MQTT.Topic == "" {
		return Config{}, fmt.Errorf("MQTT_TOPIC must not be empty")
	}
	if cfg.DB.URL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL must not be empty")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func getEnvInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
