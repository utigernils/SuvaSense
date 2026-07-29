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

#ifndef HAL_SELFTEST_RESULT
#define HAL_SELFTEST_RESULT
struct SelfTestResult {
  String name;
  bool ok;
  String message;
};
#endif

class BME680Sensor {
public:
  BME680Sensor(TwoWire &wire = Wire);
  bool begin();
  BME680Data read();
  SelfTestResult selfTest();

private:
  Adafruit_BME680 _bme;
};

#endif
