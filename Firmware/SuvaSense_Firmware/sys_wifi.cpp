#include "sys_wifi.h"
#include "sys_storage_wifi.h"
#include "sys_serial.h"
#include <WiFi.h>

static unsigned long _lastReconnectAttempt = 0;
static bool _connecting = false;

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
  if (WiFi.status() == WL_CONNECTED) {
    if (_connecting) {
      _connecting = false;
      SerialJSON::sendInfo("WiFi: connected, IP " + WiFi.localIP().toString());
    }
    return;
  }

  if (!_connecting && millis() - _lastReconnectAttempt > 10000) {
    _lastReconnectAttempt = millis();
    SerialJSON::sendInfo("WiFi: reconnecting...");
    WiFi.reconnect();
  }
}

bool SysWiFi::isConnected() {
  return WiFi.status() == WL_CONNECTED;
}
