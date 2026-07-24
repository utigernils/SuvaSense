#include "hal_LED.h"

static const CRGB COLOR_FACTORY    = CRGB::Red;
static const CRGB COLOR_BOOTLOADER = CRGB::Orange;
static const CRGB COLOR_RUNTIME    = CRGB::Green;
static const unsigned long BEAT_INTERVAL = 500;

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
  FastLED.setBrightness(32);
  FastLED.clear();
  FastLED.show();

  _systemColor = SystemColor::RUNTIME;
  _lastBeat = 0;
  _beatState = false;

  return true;
}

void LEDController::update() {
  if (millis() - _lastBeat >= BEAT_INTERVAL) {
    _beatState = !_beatState;
    _lastBeat = millis();

    if (_beatState) {
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
  _leds[1] = color;
  FastLED.show();
}

void LEDController::setUserColor(uint8_t r, uint8_t g, uint8_t b) {
  _leds[1] = CRGB(r, g, b);
  FastLED.show();
}
