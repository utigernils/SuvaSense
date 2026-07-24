#include "sys_storage_led.h"
#include <Preferences.h>

static const char* NS = "suva";
static const char* KEY_BRIGHTNESS   = "led_bright";
static const char* KEY_USERLED_EN   = "led_user_en";
static const char* KEY_SYSLED_EN    = "led_sys_en";

uint8_t StorageLED::getBrightness() {
  Preferences prefs;
  prefs.begin(NS, true);
  uint8_t val = prefs.getUChar(KEY_BRIGHTNESS, 32);
  prefs.end();
  return val;
}

void StorageLED::setBrightness(uint8_t brightness) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putUChar(KEY_BRIGHTNESS, brightness);
  prefs.end();
}

bool StorageLED::isUserLEDEnabled() {
  Preferences prefs;
  prefs.begin(NS, true);
  bool val = prefs.getBool(KEY_USERLED_EN, true);
  prefs.end();
  return val;
}

void StorageLED::setUserLEDEnabled(bool enabled) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putBool(KEY_USERLED_EN, enabled);
  prefs.end();
}

bool StorageLED::isSystemLEDEnabled() {
  Preferences prefs;
  prefs.begin(NS, true);
  bool val = prefs.getBool(KEY_SYSLED_EN, true);
  prefs.end();
  return val;
}

void StorageLED::setSystemLEDEnabled(bool enabled) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putBool(KEY_SYSLED_EN, enabled);
  prefs.end();
}
