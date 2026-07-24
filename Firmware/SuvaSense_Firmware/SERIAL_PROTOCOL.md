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
{"type":"response","action":"set","target":"ssid","error":"not implemented"}
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

| Command | Description | Response |
|---|---|---|
| `{"action":"set_serial","value":"SN12345"}` | Store serial number, mark factory complete, reboot | Info log, then reboot |
| `<raw text line>` | Legacy fallback — any non-JSON line is treated as the serial number | Info log, then reboot |

### Bootloader / Runtime

| Command | Description | Response |
|---|---|---|
| `{"action":"ping"}` | Health check | `{"type":"pong"}` |
| `{"action":"get","target":"..."}` | Read a stored setting | Not implemented yet |
| `{"action":"set","target":"...","value":"..."}` | Write a stored setting | Not implemented yet |

### Planned Targets (not yet wired)

Uses `action: "get"` / `"set"` with these targets:

| Category | Targets | Type |
|---|---|---|
| WiFi | `ssid`, `password`, `hostname` | string |
| MQTT | `broker`, `port`, `client_id`, `username`, `password`, `topic_prefix`, `keep_alive` | string / number |
| Sensors | `publish_interval`, `mpu_en`, `veml_en`, `bme_en`, `sys_en` | number / bool |
| LED | `brightness`, `user_led`, `sys_led` | number / bool |
| System | `boot_count` | number (read-only) |

---

## Boot Flow

```
Power on
  ├─ First boot (factory not done) → Factory state
  │     Accepts {"action":"set_serial","value":"..."}
  │     Stores serial → sets factory_done → reboots
  │
  └─ Normal boot
        Waits 5s for {"action":"bootloader"}
        ├─ Received → Bootloader state
        │     Accepts get/set/ping commands
        └─ Timeout → Runtime state
              Accepts get/set/ping commands
```
