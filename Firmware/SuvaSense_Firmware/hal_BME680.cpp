#include "hal_BME680.h"

#define SEALEVELPRESSURE_HPA (1013.25)

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
