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

  SerialJSON::Command cmd = SerialJSON::readCommand();

  if (cmd.action == "_parse_error") {
    SerialJSON::sendError(cmd.value);
    return;
  }

  if (!cmd.valid) return;

  if (cmd.action == "ping") {
    SerialJSON::sendPong();
    return;
  }

  if (cmd.action == "reboot") {
    SerialJSON::sendInfo("Rebooting...");
    delay(500);
    ESP.restart();
    return;
  }

}
