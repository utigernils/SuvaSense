#ifndef SYS_PAYLOAD_H
#define SYS_PAYLOAD_H

#include <Arduino.h>

namespace Payload {
  void setup();
  String build();
  void writeToSerial();
  String selfTest(const String& sensorName);
}

#endif
