#ifndef HAL_VEML7700_H
#define HAL_VEML7700_H

#include <Arduino.h>
#include <Adafruit_VEML7700.h>

struct VEML7700Data {
  float lux;
  float white;
};

#ifndef HAL_SELFTEST_RESULT
#define HAL_SELFTEST_RESULT
struct SelfTestResult {
  String name;
  bool ok;
  String message;
};
#endif

class VEML7700Sensor {
public:
  VEML7700Sensor(TwoWire &wire = Wire);
  bool begin();
  VEML7700Data read();
  SelfTestResult selfTest();

private:
  Adafruit_VEML7700 _veml;
};

#endif
