#include "MPU6050Sensor.h"
#include "VEML7700Sensor.h"
#include "BME680Sensor.h"

MPU6050Sensor mpu;
VEML7700Sensor veml;
BME680Sensor bme;

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

  Serial.println("=== Setup complete ===");
}

void loop() {
  MPU6050Data mpuData = mpu.read();
  VEML7700Data vemlData = veml.read();
  BME680Data bmeData = bme.read();

  Serial.println("--- MPU6050 ---");
  Serial.print("  Acc (m/s2): X=");
  Serial.print(mpuData.accX);
  Serial.print(" Y=");
  Serial.print(mpuData.accY);
  Serial.print(" Z=");
  Serial.println(mpuData.accZ);
  Serial.print("  Gyro (deg/s): X=");
  Serial.print(mpuData.gyroX);
  Serial.print(" Y=");
  Serial.print(mpuData.gyroY);
  Serial.print(" Z=");
  Serial.println(mpuData.gyroZ);
  Serial.print("  Angles: X=");
  Serial.print(mpuData.angX);
  Serial.print(" Y=");
  Serial.print(mpuData.angY);
  Serial.print(" Z=");
  Serial.println(mpuData.angZ);
  Serial.println();

  Serial.println("--- VEML7700 ---");
  Serial.print("  Lux: ");
  Serial.print(vemlData.lux);
  Serial.print("  White: ");
  Serial.println(vemlData.white);

  Serial.println("--- BME680 ---");
  Serial.print("  Temperature: ");
  Serial.print(bmeData.temperature);
  Serial.println(" C");
  Serial.print("  Humidity: ");
  Serial.print(bmeData.humidity);
  Serial.println(" %");
  Serial.print("  Pressure: ");
  Serial.print(bmeData.pressure);
  Serial.println(" hPa");
  Serial.print("  Gas Resistance: ");
  Serial.print(bmeData.gasResistance);
  Serial.println(" KOhms");
  Serial.print("  Altitude: ");
  Serial.print(bmeData.altitude);
  Serial.println(" m");

  Serial.println("========================");
  delay(1000);
}
