#include "sys_factory.h"
#include "hal_LED.h"
#include "sys_storage_system.h"
#include "sys_serial.h"
#include <Arduino.h>

extern LEDController leds;

static bool _done = false;

void Factory::setup() {
  leds.setSystemColor(SystemColor::FACTORY);
  SerialJSON::sendInfo("Factory mode - enter serial number via JSON or raw text");
  _done = false;
}

void Factory::loop() {
  static String input = "";

  if (_done) return;

  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (input.length() > 0) {
        input.trim();

        StorageSystem::setSerialNumber(input);
        StorageSystem::setFactoryDone(true);

        SerialJSON::sendInfo("Serial number stored. Rebooting...");
        _done = true;
        delay(1000);
        ESP.restart();
      }
      input = "";
    } else {
      input += c;
    }
  }
}
