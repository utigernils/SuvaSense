#ifndef HAL_LED_H
#define HAL_LED_H

#include <Arduino.h>
#include <FastLED.h>

#define LED_PIN D2
#define LED_COUNT 2

enum class SystemColor {
  FACTORY,
  BOOTLOADER,
  RUNTIME
};

#ifndef HAL_SELFTEST_RESULT
#define HAL_SELFTEST_RESULT
struct SelfTestResult {
  String name;
  bool ok;
  String message;
};
#endif

class LEDController {
public:
  bool begin();
  void update();

  void setSystemColor(SystemColor color);
  void setUserColor(CRGB color);
  void setUserColor(uint8_t r, uint8_t g, uint8_t b);

  void startupAnimation();
  void setBoth(CRGB color);

  SelfTestResult selfTest();

private:
  CRGB _leds[LED_COUNT];
  unsigned long _lastBeat;
  bool _beatState;
  SystemColor _systemColor;
  bool _initialized = false;
};

#endif
