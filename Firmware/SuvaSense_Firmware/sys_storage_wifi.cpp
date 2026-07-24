#include "sys_storage_wifi.h"
#include <Preferences.h>

static const char* NS = "suva";
static const char* KEY_SSID     = "wifi_ssid";
static const char* KEY_PASSWORD = "wifi_pass";
static const char* KEY_HOSTNAME = "wifi_host";

String StorageWiFi::getSSID() {
  Preferences prefs;
  prefs.begin(NS, true);
  String val = prefs.getString(KEY_SSID, "");
  prefs.end();
  return val;
}

void StorageWiFi::setSSID(const String& ssid) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putString(KEY_SSID, ssid);
  prefs.end();
}

String StorageWiFi::getPassword() {
  Preferences prefs;
  prefs.begin(NS, true);
  String val = prefs.getString(KEY_PASSWORD, "");
  prefs.end();
  return val;
}

void StorageWiFi::setPassword(const String& password) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putString(KEY_PASSWORD, password);
  prefs.end();
}

String StorageWiFi::getHostname() {
  Preferences prefs;
  prefs.begin(NS, true);
  String val = prefs.getString(KEY_HOSTNAME, "");
  prefs.end();
  if (val.length() > 0) return val;

  prefs.begin(NS, true);
  String serial = prefs.getString("serial_num", "");
  prefs.end();
  return "suva-" + serial;
}

void StorageWiFi::setHostname(const String& hostname) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putString(KEY_HOSTNAME, hostname);
  prefs.end();
}
