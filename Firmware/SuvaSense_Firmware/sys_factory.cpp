#include "sys_factory.h"
#include "hal_LED.h"
#include "sys_storage_system.h"
#include <Arduino.h>

extern LEDController leds;

static bool _done = false;

void Factory::setup() {
  leds.setSystemColor(SystemColor::FACTORY);
  Serial.println("=== FACTORY MODE ===");
  Serial.println("Enter serial number followed by newline...");
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

        Serial.print("Serial number '");
        Serial.print(input);
        Serial.println("' stored. Rebooting...");
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
