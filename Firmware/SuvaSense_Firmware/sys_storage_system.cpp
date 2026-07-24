#include "sys_storage_system.h"
#include "sys_storage_wifi.h"
#include "sys_storage_mqtt.h"
#include "sys_storage_sensors.h"
#include "sys_storage_led.h"
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

void StorageSystem::factoryReset() {
  StorageWiFi::setSSID("");
  StorageWiFi::setPassword("");
  StorageWiFi::setHostname("");

  StorageMQTT::setBroker("");
  StorageMQTT::setPort(1883);
  StorageMQTT::setClientID("");
  StorageMQTT::setUsername("");
  StorageMQTT::setPassword("");
  StorageMQTT::setTopicPrefix("");
  StorageMQTT::setKeepAlive(60);

  StorageSensors::setPublishInterval(10000);
  StorageSensors::setMPU6050Enabled(true);
  StorageSensors::setVEML7700Enabled(true);
  StorageSensors::setBME680Enabled(true);
  StorageSensors::setSystemTelemetryEnabled(true);

  StorageLED::setBrightness(32);
  StorageLED::setUserLEDEnabled(true);
  StorageLED::setSystemLEDEnabled(true);

  setBootCount(0);
}
