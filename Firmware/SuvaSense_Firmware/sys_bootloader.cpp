#include "sys_bootloader.h"
#include "hal_LED.h"
#include <Arduino.h>

extern LEDController leds;

void Bootloader::setup() {
  leds.setSystemColor(SystemColor::BOOTLOADER);
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
