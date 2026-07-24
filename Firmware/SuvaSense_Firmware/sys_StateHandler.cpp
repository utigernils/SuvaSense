#include "sys_StateHandler.h"
#include "sys_factory.h"
#include "sys_bootloader.h"
#include "sys_runtime.h"
#include "sys_storage_system.h"

static const char* PREFS_NAMESPACE = "suva";
static const char* KEY_FACTORY_DONE = "factory_done";
static const char* KEY_SERIAL_NUM = "serial_num";
static const char* BOOTLOADER_KEY = "bootloader";

StateHandler::StateHandler() {
  memset(_serialNumber, 0, sizeof(_serialNumber));
}

DeviceState StateHandler::boot() {
  StorageSystem::incrementBootCount();

  if (_isFirstBoot()) {
    _enterFactory();
    return DeviceState::FACTORY;
  }

  _prefs.begin(PREFS_NAMESPACE, true);
  size_t len = _prefs.getString(KEY_SERIAL_NUM, _serialNumber, sizeof(_serialNumber));
  _prefs.end();

  Serial.println("Waiting 5s for bootloader key...");
  unsigned long start = millis();
  String input = "";
  bool bootloaderTriggered = false;

  while (millis() - start < 5000) {
    while (Serial.available()) {
      char c = Serial.read();
      if (c == '\n' || c == '\r') {
        if (input.equals(BOOTLOADER_KEY)) {
          bootloaderTriggered = true;
        }
        input = "";
      } else {
        input += c;
      }
    }
    if (bootloaderTriggered) break;
    delay(10);
  }

  if (bootloaderTriggered) {
    _enterBootloader();
    return DeviceState::BOOTLOADER;
  }

  _enterRunning();
  return DeviceState::RUNNING;
}

bool StateHandler::_isFirstBoot() {
  _prefs.begin(PREFS_NAMESPACE, false);
  bool done = _prefs.getBool(KEY_FACTORY_DONE, false);
  _prefs.end();
  return !done;
}

void StateHandler::_enterFactory() {
  Factory::setup();
}

void StateHandler::_enterBootloader() {
  Bootloader::setup();
}

void StateHandler::_enterRunning() {
  Runtime::setup();
}
