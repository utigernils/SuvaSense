#ifndef SYS_STORAGE_SENSORS_H
#define SYS_STORAGE_SENSORS_H

#include <Arduino.h>

namespace StorageSensors {
  uint32_t getPublishInterval();
  void setPublishInterval(uint32_t ms);

  bool isMPU6050Enabled();
  void setMPU6050Enabled(bool enabled);

  bool isVEML7700Enabled();
  void setVEML7700Enabled(bool enabled);

  bool isBME680Enabled();
  void setBME680Enabled(bool enabled);

  bool isSystemTelemetryEnabled();
  void setSystemTelemetryEnabled(bool enabled);
}

#endif
