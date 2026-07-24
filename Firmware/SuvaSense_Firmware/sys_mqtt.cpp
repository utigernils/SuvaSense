#include "sys_mqtt.h"
#include "sys_storage_mqtt.h"
#include "sys_serial.h"
#include "sys_wifi.h"
#include <WiFi.h>
#include <PubSubClient.h>

static WiFiClient _wifiClient;
static PubSubClient _mqtt(_wifiClient);
static unsigned long _lastReconnectAttempt = 0;
static bool _configured = false;
static String _topicPrefix;
static String _broker;
static uint16_t _port;
static String _clientId;
static String _username;
static String _password;

static bool _doConnect() {
  _mqtt.disconnect();

  bool ok;
  if (_username.length() > 0) {
    ok = _mqtt.connect(_clientId.c_str(), _username.c_str(), _password.c_str());
  } else {
    ok = _mqtt.connect(_clientId.c_str());
  }

  return ok;
}

void SysMQTT::setup() {
  _broker = StorageMQTT::getBroker();

  if (_broker.length() == 0) {
    SerialJSON::sendWarn("MQTT: no broker configured");
    return;
  }

  _port       = StorageMQTT::getPort();
  _clientId   = StorageMQTT::getClientID();
  _username   = StorageMQTT::getUsername();
  _password   = StorageMQTT::getPassword();
  _topicPrefix = StorageMQTT::getTopicPrefix();

  _mqtt.setBufferSize(512);
  _mqtt.setKeepAlive(StorageMQTT::getKeepAlive());
  _mqtt.setServer(_broker.c_str(), _port);

  _configured = true;
  SerialJSON::sendInfo("MQTT: setup complete (broker " + _broker + ":" + String(_port) + ")");
}

void SysMQTT::loop() {
  if (!_configured) return;
  if (!SysWiFi::isConnected()) return;

  _mqtt.loop();

  if (_mqtt.connected()) return;

  if (millis() - _lastReconnectAttempt > 5000) {
    _lastReconnectAttempt = millis();
    SerialJSON::sendInfo("MQTT: reconnecting to " + _broker);

    if (_doConnect()) {
      SerialJSON::sendInfo("MQTT: connected");
    } else {
      SerialJSON::sendWarn("MQTT: connection failed, rc=" + String(_mqtt.state()));
    }
  }
}

bool SysMQTT::isConnected() {
  return _configured && _mqtt.connected();
}

bool SysMQTT::publish(const String& subtopic, const String& payload) {
  if (!isConnected()) return false;

  String topic = _topicPrefix + subtopic;
  return _mqtt.publish(topic.c_str(), payload.c_str());
}
