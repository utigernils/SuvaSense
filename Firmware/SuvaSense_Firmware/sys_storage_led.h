#ifndef SYS_STORAGE_LED_H
#define SYS_STORAGE_LED_H

#include <Arduino.h>

namespace StorageLED {
  uint8_t getBrightness();
  void setBrightness(uint8_t brightness);

  bool isUserLEDEnabled();
  void setUserLEDEnabled(bool enabled);

  bool isSystemLEDEnabled();
  void setSystemLEDEnabled(bool enabled);
}

#endif
