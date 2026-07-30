#include "sys_factory.h"
#include "hal_LED.h"
#include "sys_storage_system.h"
#include "sys_serial.h"
#include <Arduino.h>

extern LEDController leds;

static bool _done = false;

void Factory::setup() {
  leds.setSystemMode(SystemMode::FACTORY);
  leds.setUserLatch(UserLatch::NONE);
  SerialJSON::sendInfo("Factory mode - enter serial number via JSON or raw text");
  _done = false;
}

void Factory::loop() {
  if (_done) return;

  SerialJSON::Command cmd = SerialJSON::readCommand();

  if (cmd.action == "set_serial" && cmd.valid) {
    StorageSystem::setSerialNumber(cmd.value);
    StorageSystem::setFactoryDone(true);
    SerialJSON::sendInfo("Serial number stored. Rebooting...");
    _done = true;
    delay(1000);
    ESP.restart();
  }

  if (cmd.action == "_parse_error") {
    String line = cmd.value;
    line.trim();
    if (line.length() > 0) {
      StorageSystem::setSerialNumber(line);
      StorageSystem::setFactoryDone(true);
      SerialJSON::sendInfo("Serial number stored (raw). Rebooting...");
      _done = true;
      delay(1000);
      ESP.restart();
    }
  }
}
