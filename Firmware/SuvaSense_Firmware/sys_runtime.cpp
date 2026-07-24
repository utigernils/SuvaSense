#include "sys_runtime.h"
#include <Arduino.h>

void Runtime::setup() {
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
