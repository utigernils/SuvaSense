package ingest

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"SuvaSense_Backend/internal/config"
	"SuvaSense_Backend/internal/domain"
	"SuvaSense_Backend/internal/store"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type Service struct {
	cfg    config.MQTTConfig
	repo   *store.Repository
	client mqtt.Client
}

func NewService(cfg config.MQTTConfig, repo *store.Repository) *Service {
	return &Service{cfg: cfg, repo: repo}
}

func (s *Service) Start(ctx context.Context) error {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(s.cfg.BrokerURL)
	opts.SetClientID(s.cfg.ClientID)
	opts.SetUsername(s.cfg.Username)
	opts.SetPassword(s.cfg.Password)
	opts.SetConnectTimeout(s.cfg.ConnectTimeout)
	opts.SetAutoReconnect(true)
	opts.SetConnectRetry(true)
	opts.SetConnectRetryInterval(s.cfg.ReconnectInterval)
	opts.SetDefaultPublishHandler(s.handleMessage(ctx))
	opts.SetOnConnectHandler(func(c mqtt.Client) {
		token := c.Subscribe(s.cfg.Topic, s.cfg.QOS, s.handleMessage(ctx))
		token.Wait()
		if err := token.Error(); err != nil {
			log.Printf("mqtt subscribe error: %v", err)
			return
		}
		log.Printf("mqtt subscribed to %s", s.cfg.Topic)
	})

	s.client = mqtt.NewClient(opts)
	token := s.client.Connect()
	token.Wait()
	if err := token.Error(); err != nil {
		return fmt.Errorf("connect mqtt: %w", err)
	}

	go func() {
		<-ctx.Done()
		if s.client.IsConnected() {
			s.client.Disconnect(250)
		}
	}()

	log.Printf("mqtt connection established to %s", s.cfg.BrokerURL)
	return nil
}

func (s *Service) handleMessage(ctx context.Context) mqtt.MessageHandler {
	return func(_ mqtt.Client, msg mqtt.Message) {
		topic := msg.Topic()
		serial, err := extractSerial(topic)
		if err != nil {
			log.Printf("ingest skip topic %s: %v", topic, err)
			return
		}

		var payload domain.Payload
		if err := json.Unmarshal(msg.Payload(), &payload); err != nil {
			log.Printf("ingest invalid payload for %s: %v", topic, err)
			return
		}

		sensorID, err := s.repo.UpsertSensor(ctx, serial, topic)
		if err != nil {
			log.Printf("ingest sensor upsert failed for %s: %v", serial, err)
			return
		}

		if err := s.repo.InsertPayloadReadings(ctx, sensorID, topic, payload); err != nil {
			log.Printf("ingest readings insert failed for %s: %v", serial, err)
			return
		}

		log.Printf("ingest ok serial=%s topic=%s", serial, topic)
	}
}

func extractSerial(topic string) (string, error) {
	parts := strings.Split(topic, "/")
	if len(parts) < 3 {
		return "", fmt.Errorf("topic has less than 3 segments")
	}
	serial := strings.TrimSpace(parts[len(parts)-2])
	if serial == "" {
		return "", fmt.Errorf("topic serial segment empty")
	}
	if strings.TrimSpace(parts[len(parts)-1]) != "data" {
		return "", fmt.Errorf("topic must end with data segment")
	}
	return serial, nil
}
