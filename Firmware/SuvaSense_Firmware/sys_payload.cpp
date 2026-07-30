#include "sys_payload.h"
#include "hal_MPU6050.h"
#include "hal_VEML7700.h"
#include "hal_BME680.h"
#include "hal_ESP32System.h"
#include "hal_LED.h"
#include "sys_storage_sensors.h"
#include "sys_serial.h"
#include <ArduinoJson.h>
#include <WiFi.h>

static MPU6050Sensor mpuSensor;
static VEML7700Sensor vemlSensor;
static BME680Sensor bmeSensor;
static ESP32SystemSensor sysSensor;

extern LEDController leds;

static bool _mpuOk = false;
static bool _vemlOk = false;
static bool _bmeOk = false;
static bool _sysOk = false;
static bool _initialized = false;

static void _ensureMpuReadyForSelftest() {
  if (_mpuOk) return;
  _mpuOk = mpuSensor.begin();
}

static void _ensureVemlReadyForSelftest() {
  if (_vemlOk) return;
  _vemlOk = vemlSensor.begin();
}

static void _ensureBmeReadyForSelftest() {
  if (_bmeOk) return;
  _bmeOk = bmeSensor.begin();
}

static void _ensureSystemReadyForSelftest() {
  if (_sysOk) return;
  _sysOk = sysSensor.begin();
}

static void _buildDoc(JsonDocument& doc) {
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
    if (WiFi.status() == WL_CONNECTED) {
      sys["rssi"] = WiFi.RSSI();
    }
  }
}

void Payload::setup() {
  if (_initialized) return;

  if (StorageSensors::isMPU6050Enabled()) {
    _mpuOk = mpuSensor.begin();
    SerialJSON::sendInfo("Payload: MPU6050 " + String(_mpuOk ? "ok" : "failed"));
  }
  if (StorageSensors::isVEML7700Enabled()) {
    _vemlOk = vemlSensor.begin();
    SerialJSON::sendInfo("Payload: VEML7700 " + String(_vemlOk ? "ok" : "failed"));
  }
  if (StorageSensors::isBME680Enabled()) {
    _bmeOk = bmeSensor.begin();
    SerialJSON::sendInfo("Payload: BME680 " + String(_bmeOk ? "ok" : "failed"));
  }
  if (StorageSensors::isSystemTelemetryEnabled()) {
    _sysOk = sysSensor.begin();
    SerialJSON::sendInfo("Payload: System telemetry " + String(_sysOk ? "ok" : "failed"));
  }

  _initialized = true;
}

String Payload::build() {
  StaticJsonDocument<512> doc;
  _buildDoc(doc);
  String payload;
  serializeJson(doc, payload);
  return payload;
}

void Payload::writeToSerial() {
  StaticJsonDocument<512> doc;
  _buildDoc(doc);
  serializeJson(doc, Serial);
  Serial.println();
}

String Payload::selfTest(const String& sensorName) {
  SelfTestResult result;

  if (sensorName == "bme680" || sensorName == "bme") {
    _ensureBmeReadyForSelftest();
    result = bmeSensor.selfTest();
  } else if (sensorName == "mpu6050" || sensorName == "mpu") {
    _ensureMpuReadyForSelftest();
    result = mpuSensor.selfTest();
  } else if (sensorName == "veml7700" || sensorName == "veml") {
    _ensureVemlReadyForSelftest();
    result = vemlSensor.selfTest();
  } else if (sensorName == "esp32" || sensorName == "system") {
    _ensureSystemReadyForSelftest();
    result = sysSensor.selfTest();
  } else if (sensorName == "led") {
    result = leds.selfTest();
  } else {
    StaticJsonDocument<128> doc;
    doc["ok"] = false;
    doc["error"] = "unknown sensor: " + sensorName;
    String out;
    serializeJson(doc, out);
    return out;
  }

  StaticJsonDocument<256> doc;
  doc["ok"] = result.ok;
  doc["sensor"] = result.name;
  if (result.ok) {
    doc["message"] = result.message;
  } else {
    doc["error"] = result.message;
  }
  String out;
  serializeJson(doc, out);
  return out;
}
