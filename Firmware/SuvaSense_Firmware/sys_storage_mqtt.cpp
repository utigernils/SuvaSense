#include "sys_storage_mqtt.h"
#include "sys_storage_system.h"
#include <Preferences.h>

static const char* NS = "suva";
static const char* KEY_BROKER      = "mqtt_host";
static const char* KEY_PORT        = "mqtt_port";
static const char* KEY_CLIENTID    = "mqtt_client";
static const char* KEY_USERNAME    = "mqtt_user";
static const char* KEY_PASSWORD    = "mqtt_pass";
static const char* KEY_TOPICPREFIX = "mqtt_topic";
static const char* KEY_KEEPALIVE   = "mqtt_keep";

String StorageMQTT::getBroker() {
  Preferences prefs;
  prefs.begin(NS, true);
  String val = prefs.getString(KEY_BROKER, "");
  prefs.end();
  return val;
}

void StorageMQTT::setBroker(const String& broker) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putString(KEY_BROKER, broker);
  prefs.end();
}

uint16_t StorageMQTT::getPort() {
  Preferences prefs;
  prefs.begin(NS, true);
  uint16_t val = prefs.getUShort(KEY_PORT, 1883);
  prefs.end();
  return val;
}

void StorageMQTT::setPort(uint16_t port) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putUShort(KEY_PORT, port);
  prefs.end();
}

String StorageMQTT::getClientID() {
  Preferences prefs;
  prefs.begin(NS, true);
  String val = prefs.getString(KEY_CLIENTID, "");
  prefs.end();
  if (val.length() > 0) return val;

  return StorageSystem::getSerialNumber();
}

void StorageMQTT::setClientID(const String& clientID) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putString(KEY_CLIENTID, clientID);
  prefs.end();
}

String StorageMQTT::getUsername() {
  Preferences prefs;
  prefs.begin(NS, true);
  String val = prefs.getString(KEY_USERNAME, "");
  prefs.end();
  return val;
}

void StorageMQTT::setUsername(const String& username) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putString(KEY_USERNAME, username);
  prefs.end();
}

String StorageMQTT::getPassword() {
  Preferences prefs;
  prefs.begin(NS, true);
  String val = prefs.getString(KEY_PASSWORD, "");
  prefs.end();
  return val;
}

void StorageMQTT::setPassword(const String& password) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putString(KEY_PASSWORD, password);
  prefs.end();
}

String StorageMQTT::getTopicPrefix() {
  Preferences prefs;
  prefs.begin(NS, true);
  String val = prefs.getString(KEY_TOPICPREFIX, "");
  prefs.end();
  if (val.length() > 0) return val;

  return "suva/" + StorageSystem::getSerialNumber() + "/";
}

void StorageMQTT::setTopicPrefix(const String& prefix) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putString(KEY_TOPICPREFIX, prefix);
  prefs.end();
}

uint16_t StorageMQTT::getKeepAlive() {
  Preferences prefs;
  prefs.begin(NS, true);
  uint16_t val = prefs.getUShort(KEY_KEEPALIVE, 60);
  prefs.end();
  return val;
}

void StorageMQTT::setKeepAlive(uint16_t seconds) {
  Preferences prefs;
  prefs.begin(NS, false);
  prefs.putUShort(KEY_KEEPALIVE, seconds);
  prefs.end();
}
