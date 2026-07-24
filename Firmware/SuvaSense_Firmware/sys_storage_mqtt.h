#ifndef SYS_STORAGE_MQTT_H
#define SYS_STORAGE_MQTT_H

#include <Arduino.h>

namespace StorageMQTT {
  String getBroker();
  void setBroker(const String& broker);

  uint16_t getPort();
  void setPort(uint16_t port);

  String getClientID();
  void setClientID(const String& clientID);

  String getUsername();
  void setUsername(const String& username);

  String getPassword();
  void setPassword(const String& password);

  String getTopicPrefix();
  void setTopicPrefix(const String& prefix);

  uint16_t getKeepAlive();
  void setKeepAlive(uint16_t seconds);
}

#endif
