#include "MPU6050Sensor.h"
#include "VEML7700Sensor.h"
#include "BME680Sensor.h"
#include "ESP32SystemSensor.h"

MPU6050Sensor mpu;
VEML7700Sensor veml;
BME680Sensor bme;
ESP32SystemSensor sys;

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

  ESP32SystemData sysData = sys.read();

  Serial.println("--- ESP32 System ---");
  Serial.print("  Uptime: ");
  Serial.print(sysData.uptimeSec);
  Serial.println(" s");
  Serial.print("  CPU Temp: ");
  Serial.print(sysData.cpuTempC);
  Serial.println(" C");
  Serial.print("  Free Heap: ");
  Serial.print(sysData.freeHeap);
  Serial.println(" bytes");
  Serial.print("  Free Sketch Space: ");
  Serial.print(sysData.freeSketchSpace);
  Serial.println(" bytes");
  Serial.print("  CPU Freq: ");
  Serial.print(sysData.cpuFreqMHz);
  Serial.println(" MHz");
  Serial.print("  MAC: ");
  Serial.println(sysData.macAddress);
  Serial.print("  Chip Model: ");
  Serial.println(sysData.chipModel);
  Serial.print("  Chip Revision: ");
  Serial.println(sysData.chipRevision);
  Serial.print("  Flash Size: ");
  Serial.print(sysData.flashSize);
  Serial.println(" bytes");
  Serial.print("  Flash Speed: ");
  Serial.print(sysData.flashSpeed);
  Serial.println(" Hz");
  Serial.print("  Heap Size: ");
  Serial.print(sysData.heapSize);
  Serial.println(" bytes");
  Serial.print("  Min Free Heap: ");
  Serial.print(sysData.minFreeHeap);
  Serial.println(" bytes");
  Serial.print("  Reset Reason: ");
  Serial.println(sysData.resetReason);

  Serial.println("========================");
  delay(1000);
}
