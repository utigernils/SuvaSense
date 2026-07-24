#include "sys_wifi.h"
#include "sys_storage_wifi.h"
#include "sys_serial.h"
#include "hal_LED.h"
#include <WiFi.h>

extern LEDController leds;

static unsigned long _lastReconnectAttempt = 0;
static bool _connecting = false;
static bool _wasConnected = false;
static uint8_t _blinkRemaining = 0;
static CRGB _blinkColor = CRGB::Black;
static unsigned long _blinkLastToggle = 0;

static void _startBlink(CRGB color) {
  _blinkRemaining = 4;
  _blinkColor = color;
  _blinkLastToggle = millis();
  leds.setUserColor(color);
}

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
}

void SysWiFi::loop() {
  bool connected = (WiFi.status() == WL_CONNECTED);

  if (connected) {
    if (_connecting) {
      _connecting = false;
      SerialJSON::sendInfo("WiFi: connected, IP " + WiFi.localIP().toString());
    }
    if (!_wasConnected) {
      _startBlink(CRGB::Green);
    }
  } else {
    if (_wasConnected) {
      _startBlink(CRGB::Red);
    }
  }

  _wasConnected = connected;

  if (_blinkRemaining > 0) {
    if (millis() - _blinkLastToggle >= 100) {
      _blinkLastToggle = millis();
      _blinkRemaining--;
      if (_blinkRemaining % 2 == 0) {
        leds.setUserColor(_blinkColor);
      } else {
        leds.setUserColor(CRGB::Black);
      }
    }
    return;
  }

  leds.setUserColor(CRGB::Black);

  if (!connected && !_connecting && millis() - _lastReconnectAttempt > 10000) {
    _lastReconnectAttempt = millis();
    SerialJSON::sendInfo("WiFi: reconnecting...");
    WiFi.reconnect();
  }
}

bool SysWiFi::isConnected() {
  return WiFi.status() == WL_CONNECTED;
}
