#include "hal_MPU6050.h"
#include <Wire.h>

#define MPU6050_I2C_ADDR 0x68

MPU6050Sensor::MPU6050Sensor(TwoWire &wire)
  : _mpu(wire), _wire(wire) {
}

bool MPU6050Sensor::begin() {
  _mpu.Initialize();
  _mpu.Calibrate();
  return true;
}

SelfTestResult MPU6050Sensor::selfTest() {
  SelfTestResult result;
  result.name = "MPU6050";

  _wire.beginTransmission(MPU6050_I2C_ADDR);
  if (_wire.endTransmission() != 0) {
    result.ok = false;
    result.message = "I2C probe failed at 0x" + String(MPU6050_I2C_ADDR, HEX) + " - sensor not found";
    return result;
  }

  _mpu.Initialize();
  _mpu.Calibrate();
  _mpu.Execute();

  float accX = _mpu.GetAccX();
  float accY = _mpu.GetAccY();
  float accZ = _mpu.GetAccZ();
  float gyroX = _mpu.GetGyroX();
  float gyroY = _mpu.GetGyroY();
  float gyroZ = _mpu.GetGyroZ();

  if (accX == 0.0f && accY == 0.0f && accZ == 0.0f &&
      gyroX == 0.0f && gyroY == 0.0f && gyroZ == 0.0f) {
    result.ok = false;
    result.message = "I2C OK but all readings are zero - sensor may be faulty";
    return result;
  }

  result.ok = true;
  result.message = "OK - ACC(" + String(accX, 2) + "," + String(accY, 2) + "," + String(accZ, 2) + ") GYR(" + String(gyroX, 2) + "," + String(gyroY, 2) + "," + String(gyroZ, 2) + ")";
  return result;
}

MPU6050Data MPU6050Sensor::read() {
  _mpu.Execute();

  MPU6050Data data;
  data.accX = _mpu.GetAccX();
  data.accY = _mpu.GetAccY();
  data.accZ = _mpu.GetAccZ();
  data.gyroX = _mpu.GetGyroX();
  data.gyroY = _mpu.GetGyroY();
  data.gyroZ = _mpu.GetGyroZ();
  data.rawAccX = _mpu.GetRawAccX();
  data.rawAccY = _mpu.GetRawAccY();
  data.rawAccZ = _mpu.GetRawAccZ();
  data.rawGyroX = _mpu.GetRawGyroX();
  data.rawGyroY = _mpu.GetRawGyroY();
  data.rawGyroZ = _mpu.GetRawGyroZ();
  data.angX = _mpu.GetAngX();
  data.angY = _mpu.GetAngY();
  data.angZ = _mpu.GetAngZ();
  data.angAccX = _mpu.GetAngAccX();
  data.angAccY = _mpu.GetAngAccY();
  data.angGyroX = _mpu.GetAngGyroX();
  data.angGyroY = _mpu.GetAngGyroY();
  data.angGyroZ = _mpu.GetAngGyroZ();

  return data;
}
