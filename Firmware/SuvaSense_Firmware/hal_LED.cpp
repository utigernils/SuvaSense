#include "hal_LED.h"
#include "sys_storage_led.h"

static const CRGB COLOR_FACTORY    = CRGB::Red;
static const CRGB COLOR_BOOTLOADER = CRGB::Orange;
static const CRGB COLOR_RUNTIME    = CRGB::Green;
static const CRGB COLOR_INIT       = CRGB::Cyan;
static const unsigned long BEAT_INTERVAL = 500;
static const unsigned long BOOT_WINDOW_BEAT_INTERVAL = 200;
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

static CRGB _systemModeColor(SystemMode mode) {
  switch (mode) {
    case SystemMode::FACTORY: return COLOR_FACTORY;
    case SystemMode::BOOT_WINDOW: return COLOR_BOOTLOADER;
    case SystemMode::BOOTLOADER: return COLOR_BOOTLOADER;
    case SystemMode::RUNTIME_INIT: return COLOR_INIT;
    case SystemMode::RUNTIME: return COLOR_RUNTIME;
  }
  return CRGB::Black;
}

static bool _systemModeUsesHeartbeat(SystemMode mode) {
  return mode == SystemMode::FACTORY ||
         mode == SystemMode::BOOT_WINDOW ||
         mode == SystemMode::BOOTLOADER ||
         mode == SystemMode::RUNTIME;
}

static unsigned long _systemModeBeatInterval(SystemMode mode) {
  if (mode == SystemMode::BOOT_WINDOW) return BOOT_WINDOW_BEAT_INTERVAL;
  return BEAT_INTERVAL;
}

bool LEDController::begin() {
  FastLED.addLeds<WS2813, LED_PIN, GRB>(_leds, LED_COUNT);
  _refreshLedConfig();
  FastLED.clear();
  FastLED.show();

  _systemColor = SystemColor::RUNTIME;
  _systemMode = SystemMode::RUNTIME;
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
  if (!_initialized) return;

  if (millis() - _lastConfigRefresh >= CONFIG_REFRESH_INTERVAL) {
    _lastConfigRefresh = millis();
    _refreshLedConfig();

    if (!_cfgUserEnabled) {
      _leds[1] = CRGB::Black;
    }
  }

  bool showNeeded = false;

  if (_systemModeUsesHeartbeat(_systemMode)) {
    unsigned long interval = _systemModeBeatInterval(_systemMode);
    if (millis() - _lastBeat >= interval) {
      _beatState = !_beatState;
      _lastBeat = millis();
    }
  } else {
    _beatState = true;
  }

  CRGB desiredSystem = CRGB::Black;
  if (_cfgSystemEnabled) {
    if (_systemModeUsesHeartbeat(_systemMode)) {
      desiredSystem = _beatState ? _systemModeColor(_systemMode) : CRGB::Black;
    } else {
      desiredSystem = _systemModeColor(_systemMode);
    }
  }

  if (_leds[0] != desiredSystem) {
    _leds[0] = desiredSystem;
    showNeeded = true;
  }

  if (_userEventActive) {
    if (millis() - _userEventLastToggle >= _userEventInterval) {
      _userEventLastToggle = millis();
      _userEventOn = !_userEventOn;

      if (_userEventTogglesRemaining > 0) {
        _userEventTogglesRemaining--;
      }

      if (_userEventTogglesRemaining == 0 && !_userEventOn) {
        _userEventActive = false;
      }
    }
  }

  CRGB desiredUser = CRGB::Black;
  if (_cfgUserEnabled) {
    if (_userEventActive && _userEventOn) {
      desiredUser = _userEventColor;
    } else if (_userLatch == UserLatch::STREAMING) {
      desiredUser = CRGB::Blue;
    }
  }

  if (_leds[1] != desiredUser) {
    _leds[1] = desiredUser;
    showNeeded = true;
  }

  if (showNeeded) {
    FastLED.show();
  }
}

void LEDController::setSystemMode(SystemMode mode) {
  _systemMode = mode;
  _lastBeat = 0;
  _beatState = false;
}

void LEDController::setUserLatch(UserLatch latch) {
  _userLatch = latch;
}

void LEDController::triggerUserEvent(UserEvent event) {
  _userEventActive = true;
  _userEventOn = true;
  _userEventLastToggle = millis();

  switch (event) {
    case UserEvent::WIFI_CONNECTED:
      _userEventColor = CRGB::Green;
      _userEventInterval = 100;
      _userEventTogglesRemaining = 7;
      break;
    case UserEvent::WIFI_DISCONNECTED:
      _userEventColor = CRGB::Red;
      _userEventInterval = 100;
      _userEventTogglesRemaining = 7;
      break;
    case UserEvent::MQTT_LINK_UP:
      _userEventColor = CRGB::Blue;
      _userEventInterval = 100;
      _userEventTogglesRemaining = 7;
      break;
    case UserEvent::MQTT_LINK_DOWN:
      _userEventColor = CRGB::Orange;
      _userEventInterval = 100;
      _userEventTogglesRemaining = 7;
      break;
    case UserEvent::PUBLISH:
      _userEventColor = CRGB::Yellow;
      _userEventInterval = 80;
      _userEventTogglesRemaining = 1;
      break;
  }
}

void LEDController::setSystemColor(SystemColor color) {
  _systemColor = color;

  switch (color) {
    case SystemColor::FACTORY:
      setSystemMode(SystemMode::FACTORY);
      break;
    case SystemColor::BOOTLOADER:
      setSystemMode(SystemMode::BOOTLOADER);
      break;
    case SystemColor::RUNTIME:
      setSystemMode(SystemMode::RUNTIME);
      break;
  }
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
