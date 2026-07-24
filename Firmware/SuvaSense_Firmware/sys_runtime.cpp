#include "sys_runtime.h"
#include "hal_LED.h"
#include "sys_serial.h"
#include "sys_wifi.h"
#include "sys_mqtt.h"
#include <Arduino.h>

extern LEDController leds;

static bool _helloPublished = false;

void Runtime::setup() {
  leds.setSystemColor(SystemColor::RUNTIME);
  SysWiFi::setup();
  SysMQTT::setup();
  SerialJSON::sendInfo("Runtime started");
}

void Runtime::loop() {
  SysWiFi::loop();
  SysMQTT::loop();

  if (!_helloPublished && SysMQTT::isConnected()) {
    SysMQTT::publish("status", "hello world");
    SerialJSON::sendInfo("MQTT: published hello world");
    _helloPublished = true;
  }

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
