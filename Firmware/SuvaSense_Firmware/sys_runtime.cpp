#include "sys_runtime.h"
#include "hal_LED.h"
#include "sys_serial.h"
#include <Arduino.h>

extern LEDController leds;

void Runtime::setup() {
  leds.setSystemColor(SystemColor::RUNTIME);
  SerialJSON::sendInfo("Runtime started");
}

void Runtime::loop() {
  SerialJSON::Command cmd = SerialJSON::readCommand();

  if (cmd.action == "_parse_error") {
    SerialJSON::sendError(cmd.value);
    return;
  }

  if (!cmd.valid) return;

  if (cmd.action == "ping") {
    SerialJSON::sendPong();
  } else {
    SerialJSON::sendResponse(cmd.action, cmd.target, "not implemented", false);
  }
}
