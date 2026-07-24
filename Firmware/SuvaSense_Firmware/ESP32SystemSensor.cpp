#include "ESP32SystemSensor.h"
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
