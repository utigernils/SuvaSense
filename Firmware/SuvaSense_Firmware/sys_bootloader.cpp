#include "sys_bootloader.h"
#include "hal_LED.h"
#include "sys_serial.h"
#include <Arduino.h>

extern LEDController leds;

void Bootloader::setup() {
  leds.setSystemColor(SystemColor::BOOTLOADER);
  SerialJSON::sendInfo("Bootloader mode active");
}

void Bootloader::loop() {
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
