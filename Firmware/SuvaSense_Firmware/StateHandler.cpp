#include "StateHandler.h"

static const char* PREFS_NAMESPACE = "suva";
static const char* KEY_FACTORY_DONE = "factory_done";
static const char* KEY_SERIAL_NUM = "serial_num";
static const char* BOOTLOADER_KEY = "bootloader";

StateHandler::StateHandler() {
  memset(_serialNumber, 0, sizeof(_serialNumber));
}

DeviceState StateHandler::boot() {
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
  Serial.println("=== STATE: FACTORY ===");
  Serial.println("First boot detected. Enter serial number followed by newline...");

  String input = "";
  while (true) {
    while (Serial.available()) {
      char c = Serial.read();
      if (c == '\n' || c == '\r') {
        if (input.length() > 0) {
          input.trim();
          strncpy(_serialNumber, input.c_str(), sizeof(_serialNumber) - 1);

          _prefs.begin(PREFS_NAMESPACE, false);
          _prefs.putString(KEY_SERIAL_NUM, _serialNumber);
          _prefs.putBool(KEY_FACTORY_DONE, true);
          _prefs.end();

          Serial.print("Serial number '");
          Serial.print(_serialNumber);
          Serial.println("' stored. Rebooting...");
          delay(1000);
          ESP.restart();
        }
        input = "";
      } else {
        input += c;
      }
    }
    delay(10);
  }
}

void StateHandler::_enterBootloader() {
  Serial.println("=== STATE: BOOTLOADER ===");
}

void StateHandler::_enterRunning() {
  Serial.println("=== STATE: RUNNING ===");
}
