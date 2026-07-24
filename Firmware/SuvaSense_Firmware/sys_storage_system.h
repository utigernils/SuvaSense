#ifndef SYS_STORAGE_SYSTEM_H
#define SYS_STORAGE_SYSTEM_H

#include <Arduino.h>

namespace StorageSystem {
  bool isFactoryDone();
  void setFactoryDone(bool done);

  String getSerialNumber();
  void setSerialNumber(const String& serial);

  uint32_t getBootCount();
  void setBootCount(uint32_t count);
  void incrementBootCount();
  void factoryReset();
}

#endif
