#ifndef VEML7700_SENSOR_H
#define VEML7700_SENSOR_H

#include <Arduino.h>
#include <Adafruit_VEML7700.h>

struct VEML7700Data {
  float lux;
  float white;
};

class VEML7700Sensor {
public:
  VEML7700Sensor(TwoWire &wire = Wire);
  bool begin();
  VEML7700Data read();

private:
  Adafruit_VEML7700 _veml;
};

#endif
