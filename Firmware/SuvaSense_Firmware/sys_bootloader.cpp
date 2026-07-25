#include "sys_bootloader.h"
#include "hal_LED.h"
#include "sys_payload.h"
#include "sys_serial.h"
#include "sys_storage_wifi.h"
#include "sys_storage_mqtt.h"
#include "sys_storage_sensors.h"
#include "sys_storage_led.h"
#include "sys_storage_system.h"
#include <Arduino.h>

extern LEDController leds;

static bool _streaming = false;

static void handleGet(const String& target);
static void handleSet(const String& target, const String& value);

void Bootloader::setup() {
  leds.setSystemColor(SystemColor::BOOTLOADER);
  SerialJSON::sendInfo("Bootloader mode active");
}

void Bootloader::loop() {
  if (_streaming) {
    Payload::writeToSerial();

    SerialJSON::Command cmd = SerialJSON::readCommand();
    if (cmd.valid && cmd.action == "stream" && cmd.target == "stop") {
      _streaming = false;
      SerialJSON::sendInfo("Streaming stopped");
    }
    return;
  }

  SerialJSON::Command cmd = SerialJSON::readCommand();

  if (cmd.action == "_parse_error") {
    SerialJSON::sendError(cmd.value);
    return;
  }

  if (!cmd.valid) return;

  if (cmd.action == "ping") {
    SerialJSON::sendPong();
    return;
  }

  if (cmd.action == "factory_reset") {
    StorageSystem::factoryReset();
    SerialJSON::sendInfo("Factory reset complete. Rebooting...");
    delay(1000);
    ESP.restart();
    return;
  }

  if (cmd.action == "reboot") {
    SerialJSON::sendInfo("Rebooting...");
    delay(500);
    ESP.restart();
    return;
  }

  if (cmd.action == "stream") {
    if (cmd.target == "start") {
      Payload::setup();
      _streaming = true;
      SerialJSON::sendInfo("Streaming started");
    } else if (cmd.target == "stop") {
      _streaming = false;
      SerialJSON::sendInfo("Streaming stopped");
    } else {
      SerialJSON::sendResponse("stream", cmd.target, "unknown target", false);
    }
    return;
  }

  if (cmd.action == "get") {
    handleGet(cmd.target);
    return;
  }

  if (cmd.action == "set") {
    handleSet(cmd.target, cmd.value);
    return;
  }

  SerialJSON::sendResponse(cmd.action, cmd.target, "unknown action", false);
}

static void handleGet(const String& target) {
  if (target == "ssid") {
    SerialJSON::sendResponse("get", target, StorageWiFi::getSSID(), true);
  } else if (target == "wifi_password") {
    SerialJSON::sendResponse("get", target, StorageWiFi::getPassword(), true);
  } else if (target == "hostname") {
    SerialJSON::sendResponse("get", target, StorageWiFi::getHostname(), true);

  } else if (target == "broker") {
    SerialJSON::sendResponse("get", target, StorageMQTT::getBroker(), true);
  } else if (target == "port") {
    SerialJSON::sendResponse("get", target, String(StorageMQTT::getPort()), true);
  } else if (target == "client_id") {
    SerialJSON::sendResponse("get", target, StorageMQTT::getClientID(), true);
  } else if (target == "mqtt_username") {
    SerialJSON::sendResponse("get", target, StorageMQTT::getUsername(), true);
  } else if (target == "mqtt_password") {
    SerialJSON::sendResponse("get", target, StorageMQTT::getPassword(), true);
  } else if (target == "topic_prefix") {
    SerialJSON::sendResponse("get", target, StorageMQTT::getTopicPrefix(), true);
  } else if (target == "keep_alive") {
    SerialJSON::sendResponse("get", target, String(StorageMQTT::getKeepAlive()), true);

  } else if (target == "publish_interval") {
    SerialJSON::sendResponse("get", target, String(StorageSensors::getPublishInterval()), true);
  } else if (target == "mpu_en") {
    SerialJSON::sendResponse("get", target, StorageSensors::isMPU6050Enabled() ? "true" : "false", true);
  } else if (target == "veml_en") {
    SerialJSON::sendResponse("get", target, StorageSensors::isVEML7700Enabled() ? "true" : "false", true);
  } else if (target == "bme_en") {
    SerialJSON::sendResponse("get", target, StorageSensors::isBME680Enabled() ? "true" : "false", true);
  } else if (target == "sys_telem") {
    SerialJSON::sendResponse("get", target, StorageSensors::isSystemTelemetryEnabled() ? "true" : "false", true);

  } else if (target == "brightness") {
    SerialJSON::sendResponse("get", target, String(StorageLED::getBrightness()), true);
  } else if (target == "user_led") {
    SerialJSON::sendResponse("get", target, StorageLED::isUserLEDEnabled() ? "true" : "false", true);
  } else if (target == "sys_led") {
    SerialJSON::sendResponse("get", target, StorageLED::isSystemLEDEnabled() ? "true" : "false", true);

  } else if (target == "boot_count") {
    SerialJSON::sendResponse("get", target, String(StorageSystem::getBootCount()), true);
  } else if (target == "serial_num") {
    SerialJSON::sendResponse("get", target, StorageSystem::getSerialNumber(), true);
  } else if (target == "factory_done") {
    SerialJSON::sendResponse("get", target, StorageSystem::isFactoryDone() ? "true" : "false", true);

  } else {
    SerialJSON::sendResponse("get", target, "unknown target", false);
  }
}

static void handleSet(const String& target, const String& value) {
  if (target == "ssid") {
    StorageWiFi::setSSID(value);
    SerialJSON::sendResponse("set", target, value, true);
  } else if (target == "wifi_password") {
    StorageWiFi::setPassword(value);
    SerialJSON::sendResponse("set", target, "***", true);
  } else if (target == "hostname") {
    StorageWiFi::setHostname(value);
    SerialJSON::sendResponse("set", target, value, true);

  } else if (target == "broker") {
    StorageMQTT::setBroker(value);
    SerialJSON::sendResponse("set", target, value, true);
  } else if (target == "port") {
    StorageMQTT::setPort(value.toInt());
    SerialJSON::sendResponse("set", target, String(StorageMQTT::getPort()), true);
  } else if (target == "client_id") {
    StorageMQTT::setClientID(value);
    SerialJSON::sendResponse("set", target, value, true);
  } else if (target == "mqtt_username") {
    StorageMQTT::setUsername(value);
    SerialJSON::sendResponse("set", target, value, true);
  } else if (target == "mqtt_password") {
    StorageMQTT::setPassword(value);
    SerialJSON::sendResponse("set", target, "***", true);
  } else if (target == "topic_prefix") {
    StorageMQTT::setTopicPrefix(value);
    SerialJSON::sendResponse("set", target, value, true);
  } else if (target == "keep_alive") {
    StorageMQTT::setKeepAlive(value.toInt());
    SerialJSON::sendResponse("set", target, String(StorageMQTT::getKeepAlive()), true);

  } else if (target == "publish_interval") {
    StorageSensors::setPublishInterval(value.toInt());
    SerialJSON::sendResponse("set", target, String(StorageSensors::getPublishInterval()), true);
  } else if (target == "mpu_en") {
    StorageSensors::setMPU6050Enabled(value == "true" || value == "1");
    SerialJSON::sendResponse("set", target, StorageSensors::isMPU6050Enabled() ? "true" : "false", true);
  } else if (target == "veml_en") {
    StorageSensors::setVEML7700Enabled(value == "true" || value == "1");
    SerialJSON::sendResponse("set", target, StorageSensors::isVEML7700Enabled() ? "true" : "false", true);
  } else if (target == "bme_en") {
    StorageSensors::setBME680Enabled(value == "true" || value == "1");
    SerialJSON::sendResponse("set", target, StorageSensors::isBME680Enabled() ? "true" : "false", true);
  } else if (target == "sys_telem") {
    StorageSensors::setSystemTelemetryEnabled(value == "true" || value == "1");
    SerialJSON::sendResponse("set", target, StorageSensors::isSystemTelemetryEnabled() ? "true" : "false", true);

  } else if (target == "brightness") {
    StorageLED::setBrightness(value.toInt());
    SerialJSON::sendResponse("set", target, String(StorageLED::getBrightness()), true);
  } else if (target == "user_led") {
    StorageLED::setUserLEDEnabled(value == "true" || value == "1");
    SerialJSON::sendResponse("set", target, StorageLED::isUserLEDEnabled() ? "true" : "false", true);
  } else if (target == "sys_led") {
    StorageLED::setSystemLEDEnabled(value == "true" || value == "1");
    SerialJSON::sendResponse("set", target, StorageLED::isSystemLEDEnabled() ? "true" : "false", true);

  } else {
    SerialJSON::sendResponse("set", target, "unknown target", false);
  }
}
