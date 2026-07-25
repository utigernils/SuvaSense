#include "hal_LED.h"
#include "sys_StateHandler.h"
#include "sys_factory.h"
#include "sys_bootloader.h"
#include "sys_runtime.h"
#include "sys_serial.h"

LEDController leds;
StateHandler stateHandler;

static DeviceState currentState;

void setup() {
  Serial.begin(115200);
  leds.begin();
  leds.startupAnimation();

  currentState = stateHandler.boot();
  SerialJSON::sendInfo("Setup complete");
}

void loop() {
  leds.update();

  switch (currentState) {
    case DeviceState::FACTORY:
      Factory::loop();
      break;
    case DeviceState::BOOTLOADER:
      Bootloader::loop();
      break;
    case DeviceState::RUNNING:
      Runtime::loop();
      break;
  }
}
