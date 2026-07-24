#ifndef SYS_STATE_HANDLER_H
#define SYS_STATE_HANDLER_H

#include <Arduino.h>
#include <Preferences.h>

enum class DeviceState {
  FACTORY,
  BOOTLOADER,
  RUNNING
};

class StateHandler {
public:
  StateHandler();
  DeviceState boot();

  const char* getSerialNumber() const { return _serialNumber; }

private:
  bool _isFirstBoot();
  void _enterFactory();
  void _enterBootloader();
  void _enterRunning();

  Preferences _prefs;
  char _serialNumber[32];
};

#endif
