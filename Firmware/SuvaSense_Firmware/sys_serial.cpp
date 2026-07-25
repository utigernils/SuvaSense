#include "sys_serial.h"
#include <ArduinoJson.h>

static const size_t JSON_BUFFER = 256;

void SerialJSON::sendResponse(const String& action, const String& target, const String& value, bool ok) {
  StaticJsonDocument<JSON_BUFFER> doc;
  doc["type"] = "response";
  doc["action"] = action;
  doc["target"] = target;
  if (ok) {
    doc["value"] = value;
  } else {
    doc["error"] = value;
  }
  serializeJson(doc, Serial);
  Serial.println();
}

void SerialJSON::sendPong() {
  StaticJsonDocument<64> doc;
  doc["type"] = "pong";
  serializeJson(doc, Serial);
  Serial.println();
}

void SerialJSON::sendLog(const String& level, const String& message) {
  StaticJsonDocument<JSON_BUFFER> doc;
  doc["type"] = "log";
  doc["level"] = level;
  doc["message"] = message;
  serializeJson(doc, Serial);
  Serial.println();
}

void SerialJSON::sendInfo(const String& message) {
  sendLog("info", message);
}

void SerialJSON::sendWarn(const String& message) {
  sendLog("warn", message);
}

void SerialJSON::sendError(const String& message) {
  sendLog("error", message);
}

SerialJSON::Command SerialJSON::readCommand() {
  Command cmd;
  cmd.action = "";
  cmd.target = "";
  cmd.value = "";
  cmd.valid = false;

  if (!Serial.available()) return cmd;

  static String lineBuffer;
  bool hasLine = false;

  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      hasLine = true;
      break;
    }
    if (lineBuffer.length() < JSON_BUFFER) {
      lineBuffer += c;
    }
  }

  if (!hasLine) return cmd;

  String line = lineBuffer;
  lineBuffer = "";
  line.trim();
  if (line.length() == 0) return cmd;

  StaticJsonDocument<JSON_BUFFER> doc;
  DeserializationError err = deserializeJson(doc, line);

  if (err) {
    cmd.action = "_parse_error";
    cmd.value = err.c_str();
    return cmd;
  }

  cmd.action = doc["action"] | "";
  cmd.target = doc["target"] | "";
  cmd.value = doc["value"] | "";
  cmd.valid = true;

  return cmd;
}
