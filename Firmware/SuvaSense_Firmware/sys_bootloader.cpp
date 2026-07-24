#include "sys_bootloader.h"
#include <Arduino.h>

void Bootloader::setup() {
  Serial.println("=== BOOTLOADER MODE ===");
  Serial.println("Waiting for commands...");
}

void Bootloader::loop() {
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 5000) {
    Serial.println("Bootloader active...");
    lastPrint = millis();
  }
}
