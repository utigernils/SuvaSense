#ifndef SYS_MQTT_H
#define SYS_MQTT_H

#include <Arduino.h>

namespace SysMQTT {
  void setup();
  void loop();
  bool isConnected();
  bool publish(const String& subtopic, const String& payload);
}

#endif
