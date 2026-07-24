#include "hal_MPU6050.h"
#include "hal_VEML7700.h"
#include "hal_BME680.h"
#include "hal_ESP32System.h"
#include "sys_StateHandler.h"
#include "sys_factory.h"
#include "sys_bootloader.h"
#include "sys_runtime.h"

MPU6050Sensor mpu;
VEML7700Sensor veml;
BME680Sensor bme;
ESP32SystemSensor sys;
StateHandler stateHandler;

static DeviceState currentState;

void setup() {
  Serial.begin(115200);

  Serial.println("Initializing MPU6050...");
  if (!mpu.begin()) {
    Serial.println("MPU6050 init failed!");
  } else {
    Serial.println("MPU6050 ready.");
  }

  Serial.println("Initializing VEML7700...");
  if (!veml.begin()) {
    Serial.println("VEML7700 init failed!");
  } else {
    Serial.println("VEML7700 ready.");
  }

  Serial.println("Initializing BME680...");
  if (!bme.begin()) {
    Serial.println("BME680 init failed!");
  } else {
    Serial.println("BME680 ready.");
  }

  Serial.println("Initializing ESP32 System...");
  if (!sys.begin()) {
    Serial.println("ESP32 System init failed!");
  } else {
    Serial.println("ESP32 System ready.");
  }

  currentState = stateHandler.boot();
  Serial.println("=== Setup complete ===");
}

void loop() {
  switch (currentState) {
    case DeviceState::FACTORY:
      Factory::loop();
      break;
    case DeviceState::BOOTLOADER:
      Bootloader::loop();
      break;
    case DeviceState::RUNNING:
      Runtime::loop();
      break;
  }
}
