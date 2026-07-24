#ifndef SYS_SERIAL_H
#define SYS_SERIAL_H

#include <Arduino.h>

namespace SerialJSON {

  struct Command {
    String action;
    String target;
    String value;
    bool valid;
  };

  void sendResponse(const String& action, const String& target, const String& value, bool ok);

  void sendPong();

  void sendLog(const String& level, const String& message);
  void sendInfo(const String& message);
  void sendWarn(const String& message);
  void sendError(const String& message);

  Command readCommand();
}

#endif
