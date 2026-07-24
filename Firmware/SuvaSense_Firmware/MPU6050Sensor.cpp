#include "MPU6050Sensor.h"

MPU6050Sensor::MPU6050Sensor(TwoWire &wire)
  : _mpu(wire) {
}

bool MPU6050Sensor::begin() {
  _mpu.Initialize();
  _mpu.Calibrate();
  return true;
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
