#include "sys_runtime.h"
#include "hal_LED.h"
#include "sys_serial.h"
#include "sys_wifi.h"
#include <Arduino.h>

extern LEDController leds;

void Runtime::setup() {
  leds.setSystemColor(SystemColor::RUNTIME);
  SysWiFi::setup();
  SerialJSON::sendInfo("Runtime started");
}

void Runtime::loop() {
  SysWiFi::loop();
}
