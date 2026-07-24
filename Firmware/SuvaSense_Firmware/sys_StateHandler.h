#ifndef SYS_STATE_HANDLER_H
#define SYS_STATE_HANDLER_H

#include <Arduino.h>

enum class DeviceState {
  FACTORY,
  BOOTLOADER,
  RUNNING
};

class StateHandler {
public:
  StateHandler();
  DeviceState boot();

private:
  void _enterFactory();
  void _enterBootloader();
  void _enterRunning();
};

#endif
