#include "sys_runtime.h"
#include "hal_LED.h"
#include "hal_MPU6050.h"
#include "hal_VEML7700.h"
#include "hal_BME680.h"
#include "hal_ESP32System.h"
#include "sys_serial.h"
#include "sys_wifi.h"
#include "sys_mqtt.h"
#include "sys_storage_sensors.h"
#include "sys_storage_led.h"
#include "sys_storage_system.h"
#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>

extern LEDController leds;

MPU6050Sensor mpuSensor;
VEML7700Sensor vemlSensor;
BME680Sensor bmeSensor;
ESP32SystemSensor sysSensor;

static bool _mpuOk = false;
static bool _vemlOk = false;
static bool _bmeOk = false;
static bool _sysOk = false;

static unsigned long _lastPublish = 0;
static unsigned long _publishBlinkUntil = 0;

static void _blinkPublish() {
  _publishBlinkUntil = millis() + 80;
  leds.setUserColor(CRGB::Yellow);
}

static void _buildAndPublish() {
  StaticJsonDocument<512> doc;

  if (_mpuOk && StorageSensors::isMPU6050Enabled()) {
    MPU6050Data d = mpuSensor.read();
    JsonObject mpu = doc.createNestedObject("mpu6050");
    JsonObject acc = mpu.createNestedObject("acc");
    acc["x"] = d.accX;
    acc["y"] = d.accY;
    acc["z"] = d.accZ;
    JsonObject gyro = mpu.createNestedObject("gyro");
    gyro["x"] = d.gyroX;
    gyro["y"] = d.gyroY;
    gyro["z"] = d.gyroZ;
    JsonObject ang = mpu.createNestedObject("ang");
    ang["x"] = d.angX;
    ang["y"] = d.angY;
    ang["z"] = d.angZ;
  }

  if (_vemlOk && StorageSensors::isVEML7700Enabled()) {
    VEML7700Data d = vemlSensor.read();
    JsonObject veml = doc.createNestedObject("veml7700");
    veml["lux"] = d.lux;
    veml["white"] = d.white;
  }

  if (_bmeOk && StorageSensors::isBME680Enabled()) {
    BME680Data d = bmeSensor.read();
    JsonObject bme = doc.createNestedObject("bme680");
    bme["temp"] = d.temperature;
    bme["hum"] = d.humidity;
    bme["press"] = d.pressure;
    bme["gas"] = d.gasResistance;
  }

  if (_sysOk && StorageSensors::isSystemTelemetryEnabled()) {
    ESP32SystemData d = sysSensor.read();
    JsonObject sys = doc.createNestedObject("system");
    sys["uptime"] = d.uptimeSec;
    sys["cpu_temp"] = d.cpuTempC;
    sys["free_heap"] = d.freeHeap;
    sys["rssi"] = WiFi.RSSI();
  }

  String payload;
  serializeJson(doc, payload);
  SysMQTT::publish("data", payload);
}

void Runtime::setup() {
  leds.setSystemColor(SystemColor::RUNTIME);

  if (StorageSensors::isMPU6050Enabled()) {
    _mpuOk = mpuSensor.begin();
    SerialJSON::sendInfo("MPU6050: " + String(_mpuOk ? "ok" : "failed"));
  }
  if (StorageSensors::isVEML7700Enabled()) {
    _vemlOk = vemlSensor.begin();
    SerialJSON::sendInfo("VEML7700: " + String(_vemlOk ? "ok" : "failed"));
  }
  if (StorageSensors::isBME680Enabled()) {
    _bmeOk = bmeSensor.begin();
    SerialJSON::sendInfo("BME680: " + String(_bmeOk ? "ok" : "failed"));
  }
  if (StorageSensors::isSystemTelemetryEnabled()) {
    _sysOk = sysSensor.begin();
    SerialJSON::sendInfo("System telemetry: " + String(_sysOk ? "ok" : "failed"));
  }

  SysWiFi::setup();
  SysMQTT::setup();
  SerialJSON::sendInfo("Runtime started");
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
