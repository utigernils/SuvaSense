#include "VEML7700Sensor.h"

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

VEML7700Data VEML7700Sensor::read() {
  VEML7700Data data;
  data.lux = _veml.readLux();
  data.white = _veml.readWhite();
  return data;
}
