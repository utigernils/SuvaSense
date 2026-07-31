#include <Arduino.h>
#include <Preferences.h>
#include <FastLED.h>
#include <esp_sleep.h>

#define LED_PIN D2
#define LED_COUNT 2

static const char* NS = "suva";
static const char* KEY_SERIAL_NUM = "serial_num";
static const char* KEY_FACTORY_DONE = "factory_done";

CRGB leds[LED_COUNT];

static void setAll(const CRGB& color) {
  for (int i = 0; i < LED_COUNT; ++i) {
    leds[i] = color;
  }
  FastLED.show();
}

static void flashCrazyRedPattern() {
  for (int i = 0; i < 30; ++i) {
    uint8_t level = (i % 2 == 0) ? 255 : (40 + (i * 13) % 140);
    setAll(CRGB(level, 0, 0));
    delay((i % 3 == 0) ? 35 : 70);

    setAll(CRGB::Black);
    delay((i % 4 == 0) ? 25 : 55);
  }
}

void setup() {
  Serial.begin(115200);
  delay(150);

  FastLED.addLeds<WS2813, LED_PIN, GRB>(leds, LED_COUNT);
  FastLED.clear();
  FastLED.setBrightness(96);
  FastLED.show();

  Preferences prefs;
  prefs.begin(NS, false);

  // Clear serial and force factory mode on next normal firmware boot.
  bool removed = prefs.remove(KEY_SERIAL_NUM);
  prefs.putBool(KEY_FACTORY_DONE, false);

  String currentSerial = prefs.getString(KEY_SERIAL_NUM, "");
  bool factoryDone = prefs.getBool(KEY_FACTORY_DONE, true);
  prefs.end();

  Serial.println("[SN-RESET] Serial number reset tool");
  Serial.println(String("[SN-RESET] serial_num removed=") + (removed ? "true" : "false"));
  Serial.println(String("[SN-RESET] serial_num now='") + currentSerial + "'");
  Serial.println(String("[SN-RESET] factory_done now=") + (factoryDone ? "true" : "false"));

  flashCrazyRedPattern();
  setAll(CRGB::Black);

  Serial.println("[SN-RESET] Done. Entering deep sleep.");
  delay(50);
}

void loop() {
  delay(50);
}
