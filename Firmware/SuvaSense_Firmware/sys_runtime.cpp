#include "sys_runtime.h"
#include "hal_LED.h"
#include <Arduino.h>

extern LEDController leds;

void Runtime::setup() {
  leds.setSystemColor(SystemColor::RUNTIME);
  Serial.println("=== RUNTIME MODE ===");
  Serial.println("Normal operation started.");
}

void Runtime::loop() {
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 10000) {
    Serial.println("Runtime active...");
    lastPrint = millis();
  }
}
