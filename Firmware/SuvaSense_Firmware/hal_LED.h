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

enum class SystemMode {
  FACTORY,
  BOOT_WINDOW,
  BOOTLOADER,
  RUNTIME_INIT,
  RUNTIME,
};

enum class UserLatch {
  NONE,
  STREAMING,
};

enum class UserEvent {
  WIFI_CONNECTED,
  WIFI_DISCONNECTED,
  MQTT_LINK_UP,
  MQTT_LINK_DOWN,
  PUBLISH,
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

  void setSystemMode(SystemMode mode);
  void setUserLatch(UserLatch latch);
  void triggerUserEvent(UserEvent event);

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
  SystemMode _systemMode;
  UserLatch _userLatch = UserLatch::NONE;
  bool _userEventActive = false;
  bool _userEventOn = false;
  uint8_t _userEventTogglesRemaining = 0;
  unsigned long _userEventLastToggle = 0;
  unsigned long _userEventInterval = 100;
  CRGB _userEventColor = CRGB::Black;
  bool _initialized = false;
};

#endif
