#include "sys_runtime.h"
#include "hal_LED.h"
#include "sys_payload.h"
#include "sys_serial.h"
#include "sys_wifi.h"
#include "sys_mqtt.h"
#include "sys_storage_sensors.h"
#include "sys_storage_led.h"
#include "sys_storage_system.h"
#include <Arduino.h>

extern LEDController leds;

static unsigned long _lastPublish = 0;
static unsigned long _publishBlinkUntil = 0;

static void _blinkPublish() {
  _publishBlinkUntil = millis() + 80;
  leds.setUserColor(CRGB::Yellow);
}

static void _buildAndPublish() {
  String payload = Payload::build();
  SerialJSON::sendInfo("MQTT publish: " + payload);
  if (SysMQTT::publish("data", payload)) {
    SerialJSON::sendInfo("MQTT publish succeeded");
  } else {
    SerialJSON::sendWarn("MQTT publish failed");
  }
}

void Runtime::setup() {
  leds.setSystemColor(SystemColor::RUNTIME);
  leds.setBoth(CRGB::Green);

  Payload::setup();

  SysWiFi::setup();
  SysMQTT::setup();
  SerialJSON::sendInfo("Runtime started");

  leds.setBoth(CRGB::Black);
}

void Runtime::loop() {
  SysWiFi::loop();
  SysMQTT::loop();

  if (_publishBlinkUntil && millis() > _publishBlinkUntil) {
    leds.setUserColor(CRGB::Black);
    _publishBlinkUntil = 0;
  }

  if (!SysMQTT::isConnected()) return;

  uint32_t interval = StorageSensors::getPublishInterval();
  if (millis() - _lastPublish >= interval) {
    _lastPublish = millis();
    _blinkPublish();
    _buildAndPublish();
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
