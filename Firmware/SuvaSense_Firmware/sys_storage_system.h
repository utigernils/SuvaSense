#ifndef SYS_STORAGE_SYSTEM_H
#define SYS_STORAGE_SYSTEM_H

#include <Arduino.h>

namespace StorageSystem {
  uint32_t getBootCount();
  void setBootCount(uint32_t count);
  void incrementBootCount();
  void factoryReset();
}

#endif
