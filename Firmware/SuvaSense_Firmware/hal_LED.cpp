#include "hal_LED.h"
#include "sys_storage_led.h"

static const CRGB COLOR_FACTORY    = CRGB::Red;
static const CRGB COLOR_BOOTLOADER = CRGB::Orange;
static const CRGB COLOR_RUNTIME    = CRGB::Green;
static const unsigned long BEAT_INTERVAL = 500;
static const unsigned long CONFIG_REFRESH_INTERVAL = 1000;

static uint8_t _cfgBrightness = 32;
static bool _cfgUserEnabled = true;
static bool _cfgSystemEnabled = true;
static unsigned long _lastConfigRefresh = 0;

static void _refreshLedConfig() {
  _cfgBrightness = StorageLED::getBrightness();
  _cfgUserEnabled = StorageLED::isUserLEDEnabled();
  _cfgSystemEnabled = StorageLED::isSystemLEDEnabled();
  FastLED.setBrightness(_cfgBrightness);
}

static CRGB _systemColorToCRGB(SystemColor c) {
  switch (c) {
    case SystemColor::FACTORY:    return COLOR_FACTORY;
    case SystemColor::BOOTLOADER: return COLOR_BOOTLOADER;
    case SystemColor::RUNTIME:    return COLOR_RUNTIME;
  }
  return CRGB::Black;
}

bool LEDController::begin() {
  FastLED.addLeds<WS2813, LED_PIN, GRB>(_leds, LED_COUNT);
  _refreshLedConfig();
  FastLED.clear();
  FastLED.show();

  _systemColor = SystemColor::RUNTIME;
  _lastBeat = 0;
  _beatState = false;
  _initialized = true;

  return true;
}

SelfTestResult LEDController::selfTest() {
  SelfTestResult result;
  result.name = "LED";

  if (!_initialized) {
    result.ok = false;
    result.message = "LED strip not initialized";
    return result;
  }

  CRGB saved0 = _leds[0];
  CRGB saved1 = _leds[1];

  _leds[0] = CRGB::Green;
  _leds[1] = CRGB::Green;
  FastLED.show();
  delay(200);

  _leds[0] = CRGB::Black;
  _leds[1] = CRGB::Black;
  FastLED.show();
  delay(200);

  _leds[0] = saved0;
  _leds[1] = saved1;
  FastLED.show();

  result.ok = true;
  result.message = "OK - " + String(LED_COUNT) + "x WS2813 on pin D2";
  return result;
}

void LEDController::update() {
  if (millis() - _lastConfigRefresh >= CONFIG_REFRESH_INTERVAL) {
    _lastConfigRefresh = millis();
    _refreshLedConfig();

    if (!_cfgUserEnabled) {
      _leds[1] = CRGB::Black;
    }
  }

  if (millis() - _lastBeat >= BEAT_INTERVAL) {
    _beatState = !_beatState;
    _lastBeat = millis();

    if (_cfgSystemEnabled && _beatState) {
      _leds[0] = _systemColorToCRGB(_systemColor);
    } else {
      _leds[0] = CRGB::Black;
    }

    FastLED.show();
  }
}

void LEDController::setSystemColor(SystemColor color) {
  _systemColor = color;
}

void LEDController::setUserColor(CRGB color) {
  _leds[1] = _cfgUserEnabled ? color : CRGB::Black;
  FastLED.show();
}

void LEDController::setUserColor(uint8_t r, uint8_t g, uint8_t b) {
  _leds[1] = _cfgUserEnabled ? CRGB(r, g, b) : CRGB::Black;
  FastLED.show();
}

void LEDController::startupAnimation() {
  for (int i = 0; i < LED_COUNT; i++) {
    if ((i == 0 && _cfgSystemEnabled) || (i == 1 && _cfgUserEnabled)) {
      _leds[i] = CRGB::Blue;
    } else {
      _leds[i] = CRGB::Black;
    }
    FastLED.show();
    delay(80);
    _leds[i] = CRGB::Black;
    FastLED.show();
    delay(40);
  }

  for (int i = 0; i < 2; i++) {
    _leds[0] = _cfgSystemEnabled ? CRGB::Blue : CRGB::Black;
    _leds[1] = _cfgUserEnabled ? CRGB::Blue : CRGB::Black;
    FastLED.show();
    delay(120);
    _leds[0] = CRGB::Black;
    _leds[1] = CRGB::Black;
    FastLED.show();
    delay(120);
  }
}

void LEDController::setBoth(CRGB color) {
  _leds[0] = _cfgSystemEnabled ? color : CRGB::Black;
  _leds[1] = _cfgUserEnabled ? color : CRGB::Black;
  FastLED.show();
}
