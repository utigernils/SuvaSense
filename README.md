# SuvaSense

Open-source ESP32 sensor board with MQTT firmware. Ships ready to flash — connect to serial, configure WiFi, and start publishing environmental data.

<img  height="500" alt="image" src="https://github.com/user-attachments/assets/40b9ed89-22ae-41ba-aef7-5fb9d85fac8c" />
<img height="500" alt="image" src="https://github.com/user-attachments/assets/89e5c55e-4446-4952-9355-4b11f0464027" />



## Hardware

| Component | Details |
|---|---|
| **MCU** | ESP32 |
| **Temperature / Humidity / Pressure / Gas** | BME680 |
| **Accelerometer / Gyroscope** | MPU6050 |
| **Ambient Light** | VEML7700 |
| **Status LEDs** | 2x WS2813 RGB (NeoPixel-compatible) |
| **Connectivity** | 2.4 GHz WiFi, MQTT (publish-only) |

3D-printable case files are in [`CAD/`](CAD/). Gerber files for PCB fabrication are in [`PCB/`](PCB/).

## Quick Start

### 1. Flash the Firmware

Open `Firmware/SuvaSense_Firmware/SuvaSense_Firmware.ino` in Arduino IDE or PlatformIO. Install the required libraries, select your ESP32 board, and flash.

### 2. First Boot — Factory Setup

On first boot the system LED blinks **red**. The device waits for a serial number. Connect a serial terminal (115200 baud, newline termination) and send:

```
{"action":"set_serial","value":"SN12345"}
```

Or simply type the serial number and press enter (legacy fallback):

```
SN12345
```

The device stores the serial number and reboots.

### 3. Configure WiFi & MQTT

After factory setup, the device boots and gives you a **5-second window** (system LED blinks orange) to enter configuration mode. Send:

```
{"action":"bootloader"}
```

The system LED switches to a steady orange heartbeat. You are now in bootloader mode and can configure all settings:

```
{"action":"set","target":"ssid","value":"MyWiFi"}
{"action":"set","target":"wifi_password","value":"MyPassword"}
{"action":"set","target":"broker","value":"192.168.1.100"}
{"action":"set","target":"port","value":"1883"}
```

Verify your settings:

```
{"action":"get","target":"ssid"}
```

When done, reboot into runtime:

```
{"action":"reboot"}
```

### 4. Done

After the 5-second window expires (or after a reboot), the device enters runtime mode (system LED: green heartbeat). It connects to WiFi, then MQTT, and publishes sensor data every 10 seconds (configurable) to:

```
suva/<serial>/data
```

---

## Serial Commands

All commands are JSON lines sent at 115200 baud. `target` and `value` are optional depending on the command.

### Any time (5s boot window)

| Command | What it does |
|---|---|
| `{"action":"bootloader"}` | Enter configuration mode |

### Bootloader (configuration mode)

| Command | What it does |
|---|---|
| `{"action":"ping"}` | Health check — responds with `{"type":"pong"}` |
| `{"action":"reboot"}` | Restart the ESP32 |
| `{"action":"factory_reset"}` | Wipe all settings, keep serial number |
| `{"action":"stream","target":"start"}` | Stream live sensor data to serial |
| `{"action":"stream","target":"stop"}` | Stop streaming |
| `{"action":"selftest","target":"bme680"}` | Run self-test on a sensor (see targets below) |
| `{"action":"get","target":"ssid"}` | Read a setting |
| `{"action":"set","target":"ssid","value":"MyWiFi"}` | Write a setting |

### Runtime (normal operation)

| Command | What it does |
|---|---|
| `{"action":"ping"}` | Health check |
| `{"action":"reboot"}` | Restart the ESP32 |

> To change settings at runtime: send `{"action":"reboot"}`, then `{"action":"bootloader"}` during the 5-second orange window.

### All Configurable Targets

| Target | Type | Default | Description |
|---|---|---|---|
| `ssid` | string | — | WiFi network name |
| `wifi_password` | string | — | WiFi password (masked in responses) |
| `hostname` | string | `suva-<serial>` | DHCP hostname |
| `broker` | string | — | MQTT broker IP or hostname |
| `port` | number | `1883` | MQTT broker port |
| `client_id` | string | serial number | MQTT client ID |
| `mqtt_username` | string | — | MQTT username (optional) |
| `mqtt_password` | string | — | MQTT password (masked, optional) |
| `topic_prefix` | string | `suva/<serial>/` | MQTT topic prefix |
| `keep_alive` | number | `60` | MQTT keepalive (seconds) |
| `publish_interval` | number | `10000` | Sensor publish interval (ms) |
| `mpu_en` | bool | `true` | Enable MPU6050 |
| `veml_en` | bool | `true` | Enable VEML7700 |
| `bme_en` | bool | `true` | Enable BME680 |
| `sys_telem` | bool | `true` | Enable system telemetry |
| `brightness` | number | `32` | LED brightness (0–255) |
| `user_led` | bool | `true` | Enable user LED |
| `sys_led` | bool | `true` | Enable system LED |
| `boot_count` | number | — | Total boot count (read-only) |
| `serial_num` | string | — | Device serial number (read-only) |
| `factory_done` | bool | — | Factory done flag (read-only) |

Booleans accept `"true"` / `"false"` or `"1"` / `"0"`.

### Selftest Targets

| Target | Aliases | What it tests |
|---|---|---|
| `bme680` | `bme` | I2C probe, read temperature/humidity/pressure |
| `mpu6050` | `mpu` | I2C probe, read accelerometer/gyroscope |
| `veml7700` | `veml` | I2C probe, read lux/white values |
| `esp32` | `system` | Heap, flash, CPU temperature, MAC address |
| `led` | — | LED strip flash test |

Example:
```
{"action":"selftest","target":"bme680"}
```
The device immediately responds with `Selftest triggered` and then with the result containing `ok`, sensor name, and message/error details.

---

## LED Guide

The board has two WS2813 RGB LEDs:

| LED | Role | Location |
|---|---|---|
| **System LED (LED 0)** | Device state indicator | Left side |
| **User LED (LED 1)** | Connection & activity | Right side |

### System LED — State Heartbeat (blinks every 0.5 s)

| Color | State | Meaning |
|---|---|---|
| Red | Factory | First boot — waiting for serial number |
| Orange | Bootloader | Configuration mode active |
| Green | Runtime | Normal operation, publishing data |

### User LED — Event Indicators

| Color | Pattern | Meaning |
|---|---|---|
| Blue flash (4x) | MQTT connected | Successfully connected to broker |
| Orange flash (4x) | MQTT disconnected | Lost connection to broker |
| Green flash (4x) | WiFi connected | Successfully joined network |
| Red flash (4x) | WiFi disconnected | Lost WiFi connection |
| Yellow blink | Publishing data | Sensor payload sent to MQTT |
| Solid blue | Streaming mode | Live sensor data being sent to serial |

### Boot Window

During the 5-second post-boot window, **both LEDs** blink orange rapidly (every 0.2 s). Send `{"action":"bootloader"}` to enter configuration mode, or wait for runtime.

### Power-Up Animation

On every boot, both LEDs run through a blue chase animation followed by two full flashes — confirming the LEDs and firmware are working.

---

## MQTT Data Format

The device publishes a JSON payload to `<topic_prefix>data` (default: `suva/<serial>/data`).

Each sensor object is only included if the sensor is enabled and initialized successfully.

```json
{
  "mpu6050": {
    "acc":  {"x": 0.12, "y": -0.03, "z": 9.81},
    "gyro": {"x": 0.1,  "y": 0.2,   "z": -0.1},
    "ang":  {"x": 1.5,  "y": -0.8,  "z": 0.3}
  },
  "veml7700": {
    "lux": 245.3,
    "white": 198.7
  },
  "bme680": {
    "temp": 23.5,
    "hum": 54.2,
    "press": 1013.2,
    "gas": 145.6
  },
  "system": {
    "uptime": 120,
    "cpu_temp": 42.1,
    "free_heap": 215000,
    "rssi": -55
  }
}
```

| Field | Unit | Notes |
|---|---|---|
| `mpu6050.acc` | m/s² | Accelerometer (x, y, z) |
| `mpu6050.gyro` | °/s | Gyroscope (x, y, z) |
| `mpu6050.ang` | ° | Calculated angle (x, y, z) |
| `veml7700.lux` | lx | Ambient light |
| `veml7700.white` | raw | White channel raw value |
| `bme680.temp` | °C | Temperature |
| `bme680.hum` | % | Relative humidity |
| `bme680.press` | hPa | Barometric pressure |
| `bme680.gas` | kΩ | Gas resistance |
| `system.uptime` | seconds | Millis since boot (÷1000) |
| `system.cpu_temp` | °C | ESP32 internal temperature |
| `system.free_heap` | bytes | Available RAM |
| `system.rssi` | dBm | WiFi signal strength (only when connected) |

---

## Repository Structure

```
SuvaSense/
├── CAD/                  # 3D-printable case files (.3mf)
├── Firmware/
│   └── SuvaSense_Firmware/   # Arduino/PlatformIO firmware
│       ├── hal_*              # Hardware drivers (sensors, LEDs)
│       ├── sys_*              # System services (WiFi, MQTT, storage, serial)
│       ├── SuvaSense_Firmware.ino  # Main sketch
│       ├── SERIAL_PROTOCOL.md       # Full serial protocol reference
│       └── ARCHITECTURE.md          # Naming conventions
└── PCB/                  # Gerber files and PCB documentation
```

## License

This project is open source. Hardware design files (CAD, PCB) and firmware are included in this repository.
