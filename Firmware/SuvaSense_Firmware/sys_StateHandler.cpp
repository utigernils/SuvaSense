#include "sys_StateHandler.h"
#include "sys_factory.h"
#include "sys_bootloader.h"
#include "sys_runtime.h"
#include "sys_storage_system.h"
#include "sys_serial.h"
#include "hal_LED.h"

extern LEDController leds;

StateHandler::StateHandler() {
}

DeviceState StateHandler::boot() {
  StorageSystem::incrementBootCount();

  if (!StorageSystem::isFactoryDone()) {
    _enterFactory();
    return DeviceState::FACTORY;
  }

  SerialJSON::sendInfo("Waiting 5s for bootloader trigger...");
  unsigned long start = millis();
  bool bootloaderTriggered = false;

  while (millis() - start < 5000) {
    bool blinkPhase = ((millis() - start) / 200) % 2;
    leds.setBoth(blinkPhase ? CRGB::Orange : CRGB::Black);

    SerialJSON::Command cmd = SerialJSON::readCommand();
    if (cmd.valid && cmd.action == "bootloader") {
      bootloaderTriggered = true;
      break;
    }
    if (!cmd.valid && cmd.action.length() == 0) {
      delay(10);
    }
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
