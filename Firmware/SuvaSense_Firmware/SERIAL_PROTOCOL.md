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
| `<raw text line>` | Legacy fallback — non-JSON line treated as serial number |

### Bootloader / Runtime

| Command | Target | Value | Description |
|---|---|---|---|
| `{"action":"ping"}` | — | — | Health check → `{"type":"pong"}` |
| `{"action":"reboot"}` | — | — | Restarts the ESP32 |
| `{"action":"factory_reset"}` | — | — | Clears all settings except serial + factory_done, then reboots |
| `{"action":"get","target":"..."}` | *(see table below)* | — | Read a stored setting |
| `{"action":"set","target":"...","value":"..."}` | *(see table below)* | string | Write a stored setting |

---

## Available Targets

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

### System info
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
  │     Accepts {"action":"set_serial","value":"..."} or raw line
  │     Stores serial → sets factory_done → reboots
  │
  └─ Normal boot
        Waits 5s for {"action":"bootloader"}
        ├─ Received → Bootloader state
        │     Accepts get/set/ping/reboot/factory_reset
        └─ Timeout → Runtime state
              Accepts get/set/ping/reboot/factory_reset
```
