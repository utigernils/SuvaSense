#ifndef HAL_BME680_H
#define HAL_BME680_H

#include <Arduino.h>
#include <Adafruit_BME680.h>

struct BME680Data {
  float temperature;
  float humidity;
  float pressure;
  float gasResistance;
  float altitude;
};

class BME680Sensor {
public:
  BME680Sensor(TwoWire &wire = Wire);
  bool begin();
  BME680Data read();

private:
  Adafruit_BME680 _bme;
};

#endif
