#include "hal_LED.h"
#include "sys_StateHandler.h"
#include "sys_factory.h"
#include "sys_bootloader.h"
#include "sys_runtime.h"

LEDController leds;
StateHandler stateHandler;

static DeviceState currentState;

void setup() {
  Serial.begin(115200);
  leds.begin();

  currentState = stateHandler.boot();
  Serial.println("=== Setup complete ===");
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
