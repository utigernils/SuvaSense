#include "hal_ESP32System.h"
#include "esp_mac.h"
#include "esp_chip_info.h"
#include "esp_flash.h"
#include "esp_system.h"
#include "esp_timer.h"

bool ESP32SystemSensor::begin() {
  uint8_t macBytes[6];
  esp_read_mac(macBytes, ESP_MAC_WIFI_STA);
  snprintf(_mac, sizeof(_mac), "%02X:%02X:%02X:%02X:%02X:%02X",
           macBytes[0], macBytes[1], macBytes[2],
           macBytes[3], macBytes[4], macBytes[5]);
  return true;
}

SelfTestResult ESP32SystemSensor::selfTest() {
  SelfTestResult result;
  result.name = "ESP32System";

  uint32_t freeHeap = ESP.getFreeHeap();
  uint32_t heapSize = ESP.getHeapSize();
  uint32_t flashSizeBytes = 0;
  esp_flash_get_size(NULL, &flashSizeBytes);
  float cpuTemp = temperatureRead();

  String issues = "";

  if (freeHeap < 4096) {
    issues += "Low heap (" + String(freeHeap) + "B); ";
  }

  if (flashSizeBytes == 0) {
    issues += "Flash size read failed; ";
  }

  if (cpuTemp > 85.0f) {
    issues += "High CPU temp (" + String(cpuTemp, 1) + "C); ";
  }

  if (_mac[0] == '\0') {
    issues += "MAC address not set; ";
  }

  if (issues.length() > 0) {
    result.ok = false;
    result.message = issues;
  } else {
    result.ok = true;
    result.message = "OK - Heap=" + String(freeHeap) + "/" + String(heapSize) + "B Flash=" + String(flashSizeBytes / 1024) + "KB MAC=" + String(_mac) + " CPU=" + String(cpuTemp, 1) + "C";
  }

  return result;
}

ESP32SystemData ESP32SystemSensor::read() {
  ESP32SystemData data;
  memset(&data, 0, sizeof(data));

  data.uptimeSec = esp_timer_get_time() / 1000000ULL;

  data.cpuTempC = temperatureRead();

  data.freeHeap = ESP.getFreeHeap();
  data.freeSketchSpace = ESP.getFreeSketchSpace();
  data.cpuFreqMHz = getCpuFrequencyMhz();

  strncpy(data.macAddress, _mac, sizeof(data.macAddress) - 1);

  esp_chip_info_t chipInfo;
  esp_chip_info(&chipInfo);
  data.chipModel = chipInfo.model;
  data.chipRevision = chipInfo.revision;

  uint32_t flashSizeBytes;
  if (esp_flash_get_size(NULL, &flashSizeBytes) == ESP_OK) {
    data.flashSize = flashSizeBytes;
  } else {
    data.flashSize = 0;
  }

  data.flashSpeed = ESP.getFlashChipSpeed();
  data.heapSize = ESP.getHeapSize();
  data.minFreeHeap = ESP.getMinFreeHeap();
  data.resetReason = esp_reset_reason();

  return data;
}
