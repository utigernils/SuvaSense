#include "sys_factory.h"
#include <Arduino.h>
#include <Preferences.h>

static const char* PREFS_NAMESPACE = "suva";
static const char* KEY_FACTORY_DONE = "factory_done";
static const char* KEY_SERIAL_NUM = "serial_num";

static bool _done = false;

void Factory::setup() {
  Serial.println("=== FACTORY MODE ===");
  Serial.println("Enter serial number followed by newline...");
  _done = false;
}

void Factory::loop() {
  static String input = "";

  if (_done) return;

  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (input.length() > 0) {
        input.trim();

        Preferences prefs;
        prefs.begin(PREFS_NAMESPACE, false);
        prefs.putString(KEY_SERIAL_NUM, input.c_str());
        prefs.putBool(KEY_FACTORY_DONE, true);
        prefs.end();

        Serial.print("Serial number '");
        Serial.print(input);
        Serial.println("' stored. Rebooting...");
        _done = true;
        delay(1000);
        ESP.restart();
      }
      input = "";
    } else {
      input += c;
    }
  }
}
