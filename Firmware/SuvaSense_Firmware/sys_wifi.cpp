#include "sys_wifi.h"
#include "sys_storage_wifi.h"
#include "sys_serial.h"
#include "hal_LED.h"
#include <WiFi.h>

extern LEDController leds;

static unsigned long _lastReconnectAttempt = 0;
static unsigned long _connectStart = 0;
static bool _connecting = false;
static bool _wasConnected = false;

void SysWiFi::setup() {
  String ssid     = StorageWiFi::getSSID();
  String password = StorageWiFi::getPassword();
  String hostname = StorageWiFi::getHostname();

  if (ssid.length() == 0) {
    SerialJSON::sendWarn("WiFi: no SSID configured");
    return;
  }

  WiFi.setHostname(hostname.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), password.c_str());

  SerialJSON::sendInfo("WiFi: connecting to " + ssid);
  _connecting = true;
  _connectStart = millis();
}

void SysWiFi::loop() {
  bool connected = (WiFi.status() == WL_CONNECTED);

  if (connected) {
    if (_connecting) {
      _connecting = false;
      SerialJSON::sendInfo("WiFi: connected, IP " + WiFi.localIP().toString());
    }
    if (!_wasConnected) {
      leds.triggerUserEvent(UserEvent::WIFI_CONNECTED);
    }
  } else {
    if (_connecting && millis() - _connectStart > 15000) {
      _connecting = false;
      SerialJSON::sendWarn("WiFi: connection timed out");
      leds.triggerUserEvent(UserEvent::WIFI_DISCONNECTED);
    }
    if (_wasConnected) {
      leds.triggerUserEvent(UserEvent::WIFI_DISCONNECTED);
    }
  }

  _wasConnected = connected;

  if (!connected && !_connecting && millis() - _lastReconnectAttempt > 10000) {
    _lastReconnectAttempt = millis();
    SerialJSON::sendInfo("WiFi: reconnecting...");

    bool reconnectStarted = WiFi.reconnect();
    if (reconnectStarted) {
      _connecting = true;
      _connectStart = millis();
    } else {
      SerialJSON::sendWarn("WiFi: reconnect request failed");
      leds.triggerUserEvent(UserEvent::WIFI_DISCONNECTED);
    }
  }
}

bool SysWiFi::isConnected() {
  return WiFi.status() == WL_CONNECTED;
}
