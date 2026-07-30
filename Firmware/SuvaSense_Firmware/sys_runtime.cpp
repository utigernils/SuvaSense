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
static bool _runtimeInitDone = false;

enum class RuntimeInitPhase {
  PAYLOAD,
  WIFI,
  MQTT,
  DONE,
};

static RuntimeInitPhase _initPhase = RuntimeInitPhase::PAYLOAD;

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

static bool _handleRuntimeCommand() {
  SerialJSON::Command cmd = SerialJSON::readCommand();

  if (cmd.action == "_parse_error") {
    SerialJSON::sendError(cmd.value);
    return true;
  }

  if (!cmd.valid) return false;

  if (cmd.action == "ping") {
    SerialJSON::sendPong();
    return true;
  }

  if (cmd.action == "reboot") {
    SerialJSON::sendInfo("Rebooting...");
    delay(500);
    ESP.restart();
    return true;
  }

  return false;
}

static void _runInitStep() {
  switch (_initPhase) {
    case RuntimeInitPhase::PAYLOAD:
      Payload::setup();
      _initPhase = RuntimeInitPhase::WIFI;
      return;

    case RuntimeInitPhase::WIFI:
      SysWiFi::setup();
      _initPhase = RuntimeInitPhase::MQTT;
      return;

    case RuntimeInitPhase::MQTT:
      SysMQTT::setup();
      _initPhase = RuntimeInitPhase::DONE;
      _runtimeInitDone = true;
      SerialJSON::sendInfo("Runtime started");
      leds.setBoth(CRGB::Black);
      return;

    case RuntimeInitPhase::DONE:
      return;
  }
}

void Runtime::setup() {
  leds.setSystemColor(SystemColor::RUNTIME);
  leds.setBoth(CRGB::Green);

  _lastPublish = 0;
  _publishBlinkUntil = 0;
  _runtimeInitDone = false;
  _initPhase = RuntimeInitPhase::PAYLOAD;
}

void Runtime::loop() {
  _handleRuntimeCommand();

  if (!_runtimeInitDone) {
    _runInitStep();
    return;
  }

  SysWiFi::loop();
  SysMQTT::loop();

  if (_publishBlinkUntil && millis() > _publishBlinkUntil) {
    leds.setUserColor(CRGB::Black);
    _publishBlinkUntil = 0;
  }

  if (!SysMQTT::isConnected()) {
    _handleRuntimeCommand();
    return;
  }

  uint32_t interval = StorageSensors::getPublishInterval();
  if (millis() - _lastPublish >= interval) {
    _lastPublish = millis();
    _blinkPublish();
    _buildAndPublish();
  }

  _handleRuntimeCommand();
}
