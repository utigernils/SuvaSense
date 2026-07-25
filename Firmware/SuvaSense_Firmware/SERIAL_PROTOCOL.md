# Serial JSON Protocol

Baud rate: `115200`. Each message is a single JSON line terminated by `\n`.

## ESP → Host (outgoing)

### Log
```json
{"type":"log","level":"info","message":"Runtime started"}
```
`level`: `info` | `warn` | `error`

### Pong
```json
{"type":"pong"}
```
Response to `{"action":"ping"}`.

### Command Response
```json
{"type":"response","action":"get","target":"ssid","value":"MyWiFi"}
```
```json
{"type":"response","action":"set","target":"ssid","error":"unknown target"}
```
Success includes `value`, failure includes `error`.

### Sensor Stream (bootloader only)
```json
{"mpu6050":{"acc":{"x":0.12,"y":-0.03,"z":9.81},"gyro":{"x":0.1,"y":0.2,"z":-0.1},"ang":{"x":1.5,"y":-0.8,"z":0.3}},"veml7700":{"lux":245.3,"white":198.7},"bme680":{"temp":23.5,"hum":54.2,"press":1013.2,"gas":145.6},"system":{"uptime":120,"cpu_temp":42.1,"free_heap":215000,"rssi":-55}}
```
Raw sensor JSON lines sent continuously during streaming mode. Each sensor object is only included if the sensor is enabled and initialized.

---

## Host → ESP (incoming)

All commands share the base format:
```json
{"action":"<action>","target":"<target>","value":"<value>"}
```
`target` and `value` are optional depending on the action.

### State-Agnostic

| Command | Context | Response |
|---|---|---|
| `{"action":"bootloader"}` | 5s boot window only | ESP enters bootloader mode |

### Factory State

| Command | Description |
|---|---|
| `{"action":"set_serial","value":"SN12345"}` | Store serial number, mark factory complete, reboot |
| `<raw text line>` | Legacy fallback — any non-JSON line is treated as the serial number |

The raw text fallback accepts any line that fails JSON parsing (e.g. just typing `SN12345` and pressing enter). After a successful serial number is stored, the device sets `factory_done` and reboots into normal operation.

### Bootloader State

Entered by sending `{"action":"bootloader"}` during the 5-second post-boot window, or automatically if the device has no saved configuration.

| Command | Target | Value | Description |
|---|---|---|---|
| `{"action":"ping"}` | — | — | Health check → `{"type":"pong"}` |
| `{"action":"reboot"}` | — | — | Restarts the ESP32 after 500ms |
| `{"action":"factory_reset"}` | — | — | Clears all settings except serial + factory_done, then reboots |
| `{"action":"stream","target":"start"}` | `start` | — | Begin continuous sensor JSON output to serial |
| `{"action":"stream","target":"stop"}` | `stop` | — | Stop sensor streaming |
| `{"action":"get","target":"..."}` | *(see table below)* | — | Read a stored setting |
| `{"action":"set","target":"...","value":"..."}` | *(see table below)* | string | Write a stored setting |

### Runtime State

Entered automatically after the 5-second bootloader window expires (if no `{"action":"bootloader"}` was sent).

| Command | Target | Value | Description |
|---|---|---|---|
| `{"action":"ping"}` | — | — | Health check → `{"type":"pong"}` |
| `{"action":"reboot"}` | — | — | Restarts the ESP32 after 500ms |

> **Note:** `get`, `set`, `factory_reset`, and `stream` are only available in **Bootloader** state. To change configuration at runtime, reboot and trigger the bootloader during the 5-second window.

---

## Available Targets (Bootloader get/set)

### WiFi
| Target | Type | Read/Write |
|---|---|---|
| `ssid` | string | RW |
| `wifi_password` | string | RW (set response masked as `"***"`) |
| `hostname` | string | RW (default `suva-<serial>`) |

### MQTT
| Target | Type | Read/Write |
|---|---|---|
| `broker` | string | RW |
| `port` | number | RW (default `1883`) |
| `client_id` | string | RW (default serial number) |
| `mqtt_username` | string | RW |
| `mqtt_password` | string | RW (set response masked as `"***"`) |
| `topic_prefix` | string | RW (default `suva/<serial>/`) |
| `keep_alive` | number | RW (default `60`) |

### Sensors
| Target | Type | Read/Write |
|---|---|---|
| `publish_interval` | number | RW (ms, default `10000`) |
| `mpu_en` | bool | RW (default `true`) |
| `veml_en` | bool | RW (default `true`) |
| `bme_en` | bool | RW (default `true`) |
| `sys_telem` | bool | RW (default `true`) |

### LED
| Target | Type | Read/Write |
|---|---|---|
| `brightness` | number | RW (0–255, default `32`) |
| `user_led` | bool | RW (default `true`) |
| `sys_led` | bool | RW (default `true`) |

> **Note:** LED configuration values are stored but are not currently applied at runtime. The LED controller uses hardcoded defaults.

### System (read-only)
| Target | Type |
|---|---|
| `boot_count` | number |
| `serial_num` | string |
| `factory_done` | bool |

Boolean values accept `"true"` / `"false"` or `"1"` / `"0"`.

---

## Examples

### Configure WiFi
```
→ {"action":"set","target":"ssid","value":"MyNetwork"}
← {"type":"response","action":"set","target":"ssid","value":"MyNetwork"}

→ {"action":"set","target":"wifi_password","value":"secret123"}
← {"type":"response","action":"set","target":"wifi_password","value":"***"}

→ {"action":"get","target":"ssid"}
← {"type":"response","action":"get","target":"ssid","value":"MyNetwork"}
```

### Sensor Streaming
```
→ {"action":"stream","target":"start"}
← {"type":"response","action":"stream","target":"start","value":"started"}
← {"mpu6050":{"acc":{"x":0.12,"y":-0.03,...}},...}
← {"mpu6050":{"acc":{"x":0.11,"y":-0.04,...}},...}
→ {"action":"stream","target":"stop"}
← {"type":"response","action":"stream","target":"stop","value":"stopped"}
```

### System Info
```
→ {"action":"get","target":"serial_num"}
← {"type":"response","action":"get","target":"serial_num","value":"SN12345"}

→ {"action":"get","target":"boot_count"}
← {"type":"response","action":"get","target":"boot_count","value":"42"}
```

---

## Boot Flow

```
Power on
  ├─ First boot (factory not done) → Factory state
  │     System LED: red heartbeat
  │     Accepts {"action":"set_serial","value":"..."} or raw text line
  │     Stores serial → sets factory_done → reboots
  │
  └─ Normal boot
        System LED: orange heartbeat during 5s window
        Waits 5s for {"action":"bootloader"}
        ├─ Received → Bootloader state
        │     System LED: orange heartbeat
        │     Accepts get/set/stream/ping/reboot/factory_reset
        └─ Timeout → Runtime state
              System LED: green heartbeat
              Accepts ping/reboot only
              Publishes sensor data to MQTT every publish_interval ms
```
