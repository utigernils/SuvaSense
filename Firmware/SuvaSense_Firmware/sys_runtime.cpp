#include "sys_runtime.h"
#include "hal_LED.h"
#include "sys_serial.h"
#include <Arduino.h>
#include <ArduinoJson.h>

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
    StaticJsonDocument<128> doc;
    doc["type"] = "pong";
    serializeJson(doc, Serial);
    Serial.println();
  } else {
    SerialJSON::sendResponse(cmd.action, cmd.target, "not implemented", false);
  }
}
