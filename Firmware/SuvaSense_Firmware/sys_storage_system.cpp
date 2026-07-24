#include "sys_storage_system.h"
#include <Preferences.h>

static const char* NS = "suva";
static const char* KEY_BOOT_COUNT = "sys_bootcnt";

uint32_t StorageSystem::getBootCount() {
  Preferences prefs;
  prefs.begin(NS, true);
  uint32_t val = prefs.getUInt(KEY_BOOT_COUNT, 0);
  prefs.end();
  return val;
}

void StorageSystem::setBootCount(uint32_t count) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putUInt(KEY_BOOT_COUNT, count);
  prefs.end();
}

void StorageSystem::incrementBootCount() {
  uint32_t count = getBootCount() + 1;
  setBootCount(count);
}
