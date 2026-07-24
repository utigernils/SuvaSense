#include "sys_StateHandler.h"
#include "sys_factory.h"
#include "sys_bootloader.h"
#include "sys_runtime.h"
#include "sys_storage_system.h"

static const char* BOOTLOADER_KEY = "bootloader";

StateHandler::StateHandler() {
}

DeviceState StateHandler::boot() {
  StorageSystem::incrementBootCount();

  if (!StorageSystem::isFactoryDone()) {
    _enterFactory();
    return DeviceState::FACTORY;
  }

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

void StateHandler::_enterFactory() {
  Factory::setup();
}

void StateHandler::_enterBootloader() {
  Bootloader::setup();
}

void StateHandler::_enterRunning() {
  Runtime::setup();
}
