#ifndef SYS_STORAGE_WIFI_H
#define SYS_STORAGE_WIFI_H

#include <Arduino.h>

namespace StorageWiFi {
  String getSSID();
  void setSSID(const String& ssid);

  String getPassword();
  void setPassword(const String& password);

  String getHostname();
  void setHostname(const String& hostname);
}

#endif
