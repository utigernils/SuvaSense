#include "hal_BME680.h"
#include <Wire.h>

#define SEALEVELPRESSURE_HPA (1013.25)
#define BME680_I2C_ADDR 0x77

BME680Sensor::BME680Sensor(TwoWire &wire)
  : _bme() {
}

bool BME680Sensor::begin() {
  if (!_bme.begin()) {
    return false;
  }
  _bme.setTemperatureOversampling(BME680_OS_8X);
  _bme.setHumidityOversampling(BME680_OS_2X);
  _bme.setPressureOversampling(BME680_OS_4X);
  _bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  _bme.setGasHeater(320, 150);
  return true;
}

SelfTestResult BME680Sensor::selfTest() {
  SelfTestResult result;
  result.name = "BME680";

  Wire.beginTransmission(BME680_I2C_ADDR);
  if (Wire.endTransmission() != 0) {
    result.ok = false;
    result.message = "I2C probe failed at 0x" + String(BME680_I2C_ADDR, HEX) + " - sensor not found";
    return result;
  }

  if (!_bme.performReading()) {
    result.ok = false;
    result.message = "I2C OK but read failed - sensor may be faulty";
    return result;
  }

  float temp = _bme.temperature;
  float hum = _bme.humidity;
  float press = _bme.pressure / 100.0;

  if (isnan(temp) || isnan(hum)) {
    result.ok = false;
    result.message = "I2C OK but data contains NaN - sensor may be faulty";
    return result;
  }

  result.ok = true;
  result.message = "OK - T=" + String(temp, 1) + "C H=" + String(hum, 1) + "% P=" + String(press, 1) + "hPa";
  return result;
}

BME680Data BME680Sensor::read() {
  BME680Data data;

  if (!_bme.performReading()) {
    data.temperature = NAN;
    data.humidity = NAN;
    data.pressure = NAN;
    data.gasResistance = NAN;
    data.altitude = NAN;
    return data;
  }

  data.temperature = _bme.temperature;
  data.humidity = _bme.humidity;
  data.pressure = _bme.pressure / 100.0;
  data.gasResistance = _bme.gas_resistance / 1000.0;
  data.altitude = _bme.readAltitude(SEALEVELPRESSURE_HPA);

  return data;
}
