# Tag 1 Referenz – ESP32-Konfiguration

Diese Referenz zeigt, **wie** die SuvaSense-Firmware auf einem
ESP32 konfiguriert wird, **welche Befehle** über das 5-Sekunden-
Fenster möglich sind und **welche Werte** ein Trainer in der
Bootcamp-Situation typischerweise setzt.

## Seriennummer setzen

Im 5-Sekunden-Fenster nach Reset (oder Reboot) kann die
Seriennummer im NVS-Speicher gesetzt werden:

```
{"action":"set_serial","value":"SN12345"}
{"action":"save"}
{"action":"reboot"}
```

Nach dem Reboot sollte der ESP32 im Serial Monitor zeigen:

```
[Init] Serial number set to: SN12345
[MQTT] Will publish to: suva/SN12345/data
```

## WLAN-Konfiguration

```
{"action":"set","target":"ssid","value":"SCHULUNGS_WLAN"}
{"action":"set","target":"wifi_password","value":"schulung2026"}
{"action":"set","target":"broker","value":"tcp://192.168.1.50:1883"}
{"action":"set","target":"publish_interval","value":"10000"}
{"action":"reboot"}
```

**Wichtige Werte für den Bootcamp:**

| Parameter | Bootcamp-Default | Bedeutung |
|---|---|---|
| `ssid` | `SCHULUNGS_WLAN` | WLAN-Name im Schulungsraum |
| `wifi_password` | (siehe Trainer-Briefing) | Vom Trainer |
| `broker` | `tcp://<debian-ip>:1883` | IP der Debian-Box mit Mosquitto |
| `publish_interval` | `10000` (10 s) | Wie oft der Sensor publishen soll |

## Sensor-Auswahl

Die SuvaSense-Firmware unterstützt vier Sensortypen. Im
Bootcamp sind alle aktiv, aber du kannst einzelne deaktivieren
(für Debugging oder Stresstest):

```
{"action":"set","target":"enable_bme680","value":"true"}
{"action":"set","target":"enable_veml7700","value":"true"}
{"action":"set","target":"enable_mpu6050","value":"true"}
{"action":"set","target":"enable_system","value":"true"}
```

Falls ein Sensor ausfällt oder das Board nur 1–2 Sensoren
angeschlossen hat: einfach den entsprechenden Eintrag auf
`false` setzen.

## Status abfragen

```
{"action":"status"}
```

Zeigt die aktuelle Konfiguration:

```
=== Status ===
Serial:    SN12345
SSID:      SCHULUNGS_WLAN
Broker:    tcp://192.168.1.50:1883
Interval:  10000 ms
BME680:    enabled
VEML7700:  enabled
MPU6050:   enabled
System:    enabled
WiFi RSSI: -52 dBm
Free Heap: 198432 bytes
Uptime:    47 s
```

## LED-Farben interpretieren

| Farbe | Bedeutung |
|---|---|
| Grün | Online, bereit zum Publishen |
| Blau (kurz) | Gerade am Publishen |
| Rot | Offline (kein WLAN oder Broker nicht erreichbar) |
| Violett | Im Bootloader-Modus (5-Sek-Fenster offen) |
| Aus | Kein Strom oder Hardware-Defekt |

## MQTT-Payload-Format (was der ESP sendet)

Eine Beispiel-Message, die alle 10 s gepublisht wird:

```json
{
  "bme680":   { "temp": 23.4, "hum": 51, "press": 1013.2, "gas": 145.6 },
  "veml7700": { "lux": 245.3, "white": 198.7 },
  "mpu6050":  { "acc": {"x": 0.12, "y": -0.03, "z": 9.81}, "...": "..." },
  "system":   { "uptime": 120, "cpu_temp": 42.1, "free_heap": 215000, "rssi": -55 }
}
```

Falls ein Sensor fehlt, wird sein Top-Level-Feld weggelassen
(es erscheint **nicht** als `null`).

## Bootloader-Modus manuell auslösen

Falls das 5-Sek-Fenster zu schnell weg ist (z. B. nach
Strom-Reset, der Serial-Monitor noch nicht verbunden ist):

1. **GPIO0** (z. B. D3 auf vielen Dev-Boards) mit **GND** verbinden
   (Jumper-Kabel)
2. USB einstecken
3. **GPIO0-GND** lösen
4. ESP32 ist jetzt im Bootloader-Modus
5. Im Serial Monitor (115200) erscheint `[Bootloader] Waiting for
   commands...`
6. Befehle senden
7. `{"action":"reboot"}` zum Normalbetrieb

## Häufige Fehler

| Fehler | Ursache | Lösung |
|---|---|---|
| `[MQTT] Connection refused` | Broker-IP falsch oder Mosquitto nicht gestartet | `{"action":"status"}` zeigt aktuelle Broker-IP; mit `curl` vom Laptop prüfen |
| `[WiFi] Authentication failed` | WLAN-Passwort falsch | 5-Sek-Fenster: `set target wifi_password` |
| `[WiFi] No AP found` | SSID unsichtbar oder 2.4 GHz aus | Trainer fragen |
| `[Init] BME680 not found` | I2C-Adresse 0x76 statt 0x77 | I2C-Scanner laufen lassen, Adresse anpassen |
| Serial Monitor zeigt Hieroglyphen | Baud-Rate falsch | 115200 einstellen |
| Nichts im Serial Monitor | USB-Kabel ist nur Ladekabel | Anderes Kabel probieren |

## Siehe auch

- [theorie-esp32.md](../../pe-raumklima-bootcamp/docs/tag-1/theorie-esp32.md) – Was ist der ESP32?
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen und
  Alternativen
- [config-fenster-befehle.md](config-fenster-befehle.md) –
  komplette Liste der Konfigurations-Befehle