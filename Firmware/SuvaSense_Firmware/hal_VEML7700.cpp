#include "hal_VEML7700.h"
#include <Wire.h>

#define VEML7700_I2C_ADDR 0x10

VEML7700Sensor::VEML7700Sensor(TwoWire &wire)
  : _veml() {
}

bool VEML7700Sensor::begin() {
  if (!_veml.begin()) {
    return false;
  }
  _veml.setGain(VEML7700_GAIN_1);
  _veml.setIntegrationTime(VEML7700_IT_100MS);
  return true;
}

SelfTestResult VEML7700Sensor::selfTest() {
  SelfTestResult result;
  result.name = "VEML7700";

  Wire.beginTransmission(VEML7700_I2C_ADDR);
  if (Wire.endTransmission() != 0) {
    result.ok = false;
    result.message = "I2C probe failed at 0x" + String(VEML7700_I2C_ADDR, HEX) + " - sensor not found";
    return result;
  }

  float lux = _veml.readLux();
  float white = _veml.readWhite();

  if (lux < 0.0f) {
    result.ok = false;
    result.message = "I2C OK but lux reading negative - sensor may be faulty";
    return result;
  }

  result.ok = true;
  result.message = "OK - Lux=" + String(lux, 1) + " White=" + String(white, 1);
  return result;
}

VEML7700Data VEML7700Sensor::read() {
  VEML7700Data data;
  data.lux = _veml.readLux();
  data.white = _veml.readWhite();
  return data;
}
