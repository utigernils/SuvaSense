#ifndef ESP32_SYSTEM_SENSOR_H
#define ESP32_SYSTEM_SENSOR_H

#include <Arduino.h>

struct ESP32SystemData {
  unsigned long uptimeSec;
  float cpuTempC;
  uint32_t freeHeap;
  uint32_t freeSketchSpace;
  uint32_t cpuFreqMHz;
  char macAddress[18];
  uint8_t chipModel;
  uint8_t chipRevision;
  uint32_t flashSize;
  uint32_t flashSpeed;
  uint32_t heapSize;
  uint32_t minFreeHeap;
  uint8_t resetReason;
};

class ESP32SystemSensor {
public:
  bool begin();
  ESP32SystemData read();

private:
  char _mac[18];
};

#endif
