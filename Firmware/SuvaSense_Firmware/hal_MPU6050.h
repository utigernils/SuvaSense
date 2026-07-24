#ifndef HAL_MPU6050_H
#define HAL_MPU6050_H

#include <Arduino.h>
#include <TinyMPU6050.h>

struct MPU6050Data {
  float accX;
  float accY;
  float accZ;
  float gyroX;
  float gyroY;
  float gyroZ;
  int16_t rawAccX;
  int16_t rawAccY;
  int16_t rawAccZ;
  int16_t rawGyroX;
  int16_t rawGyroY;
  int16_t rawGyroZ;
  float angX;
  float angY;
  float angZ;
  float angAccX;
  float angAccY;
  float angGyroX;
  float angGyroY;
  float angGyroZ;
};

class MPU6050Sensor {
public:
  MPU6050Sensor(TwoWire &wire = Wire);
  bool begin();
  MPU6050Data read();

private:
  MPU6050 _mpu;
};

#endif
