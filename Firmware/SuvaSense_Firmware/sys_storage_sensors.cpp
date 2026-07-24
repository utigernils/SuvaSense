#include "sys_storage_sensors.h"
#include <Preferences.h>

static const char* NS = "suva";
static const char* KEY_PUBLISH_INTERVAL = "sens_pub_ms";
static const char* KEY_ENABLE_MPU6050   = "sens_mpu_en";
static const char* KEY_ENABLE_VEML7700  = "sens_veml_en";
static const char* KEY_ENABLE_BME680    = "sens_bme_en";
static const char* KEY_ENABLE_SYSTEM    = "sens_sys_en";

uint32_t StorageSensors::getPublishInterval() {
  Preferences prefs;
  prefs.begin(NS, true);
  uint32_t val = prefs.getUInt(KEY_PUBLISH_INTERVAL, 10000);
  prefs.end();
  return val;
}

void StorageSensors::setPublishInterval(uint32_t ms) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putUInt(KEY_PUBLISH_INTERVAL, ms);
  prefs.end();
}

bool StorageSensors::isMPU6050Enabled() {
  Preferences prefs;
  prefs.begin(NS, true);
  bool val = prefs.getBool(KEY_ENABLE_MPU6050, true);
  prefs.end();
  return val;
}

void StorageSensors::setMPU6050Enabled(bool enabled) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putBool(KEY_ENABLE_MPU6050, enabled);
  prefs.end();
}

bool StorageSensors::isVEML7700Enabled() {
  Preferences prefs;
  prefs.begin(NS, true);
  bool val = prefs.getBool(KEY_ENABLE_VEML7700, true);
  prefs.end();
  return val;
}

void StorageSensors::setVEML7700Enabled(bool enabled) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putBool(KEY_ENABLE_VEML7700, enabled);
  prefs.end();
}

bool StorageSensors::isBME680Enabled() {
  Preferences prefs;
  prefs.begin(NS, true);
  bool val = prefs.getBool(KEY_ENABLE_BME680, true);
  prefs.end();
  return val;
}

void StorageSensors::setBME680Enabled(bool enabled) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putBool(KEY_ENABLE_BME680, enabled);
  prefs.end();
}

bool StorageSensors::isSystemTelemetryEnabled() {
  Preferences prefs;
  prefs.begin(NS, true);
  bool val = prefs.getBool(KEY_ENABLE_SYSTEM, true);
  prefs.end();
  return val;
}

void StorageSensors::setSystemTelemetryEnabled(bool enabled) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putBool(KEY_ENABLE_SYSTEM, enabled);
  prefs.end();
}
