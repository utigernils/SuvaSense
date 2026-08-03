# Tag 1 Referenz – 5-Sek-Fenster-Befehle

Komplette Liste der Befehle, die du im **5-Sek-Fenster nach
Reset** an die SuvaSense-Firmware senden kannst. Format:
JSON-Befehl, gefolgt von Enter.

## Verbinden

### Serial Monitor (USB)

1. Arduino IDE öffnen
2. `Tools` → `Port` → USB-Port wählen
3. `Tools` → `Serial Monitor` (oder `Ctrl+Shift+M`)
4. Baud-Rate: **115200**
5. ESP32 mit USB-Kabel verbinden
6. **Schnell** die Befehle tippen (5 s Zeit)

## Set-Befehle (Konfiguration)

```
{"action":"set","target":"ssid","value":"<wlan-name>"}
{"action":"set","target":"wifi_password","value":"<passwort>"}
{"action":"set","target":"broker","value":"<tcp://ip:1883>"}
{"action":"set","target":"publish_interval","value":"10000"}
{"action":"set","target":"enable_bme680","value":"true"}
{"action":"set","target":"enable_veml7700","value":"true"}
{"action":"set","target":"enable_mpu6050","value":"true"}
{"action":"set","target":"enable_system","value":"true"}
```

Jeder `set`-Befehl wird mit `OK` quittiert. Bei `ERROR` ist
das Ziel ungültig (z. B. Tippfehler).

## Aktions-Befehle

```
{"action":"save"}                  # Speichert aktuelle Config im NVS
{"action":"reboot"}                # Startet neu (geänderte Config wird aktiv)
{"action":"reset_config"}          # Setzt ALLE Config auf Werkseinstellung zurück
{"action":"status"}                # Zeigt aktuelle Config
{"action":"factory_reset"}         # Wie reset_config, aber löscht auch Seriennummer
{"action":"bootloader"}            # Öffnet das 5-Sek-Fenster explizit (statt Reset)
```

## Spezielle Befehle

```
{"action":"set_serial","value":"SN12345"}    # Seriennummer ändern
{"action":"i2c_scan"}                          # I2C-Adressen scannen (für Debugging)
{"action":"dump_config"}                      # Vollständige Config ausgeben
{"action":"publish_test"}                     # Eine Test-Message publishen
```

## Bootcamp-Typische Sequenz

**Erstkonfiguration (am Tag 1 oder Tag 2):**

```
{"action":"set","target":"ssid","value":"SCHULUNGS_WLAN"}
{"action":"set","target":"wifi_password","value":"schulung2026"}
{"action":"set","target":"broker","value":"tcp://192.168.1.50:1883"}
{"action":"set","target":"publish_interval","value":"10000"}
{"action":"set_serial","value":"SN12345"}
{"action":"save"}
{"action":"reboot"}
```

Nach dem Reboot sollte der ESP32 im WLAN sein und alle 10 s
publishen.

**Tageskonfiguration ändern (z. B. Broker-IP):**

```
{"action":"set","target":"broker","value":"tcp://192.168.1.51:1883"}
{"action":"save"}
{"action":"reboot"}
```

**WLAN-Passwort ändern (z. B. wenn Schulungs-WLAN-Passwort
rotiert):**

```
{"action":"set","target":"wifi_password","value":"neues-passwort"}
{"action":"save"}
{"action":"reboot"}
```

**Sensor deaktivieren (z. B. wenn BME680 kaputt):**

```
{"action":"set","target":"enable_bme680","value":"false"}
{"action":"save"}
{"action":"reboot"}
```

## Bootloader-Modus manuell auslösen (falls 5-Sek-Fenster zu kurz)

1. ESP32 vom USB trennen
2. GPIO0 (oft D3 auf Dev-Boards) mit GND über Jumper-Kabel verbinden
3. USB einstecken
4. **GPIO0** von GND lösen
5. ESP32 ist jetzt im Bootloader-Modus
6. Im Serial Monitor (115200) erscheint
   `[Bootloader] Waiting for commands...`
7. Befehle senden
8. `{"action":"reboot"}` zum Normalbetrieb

## Wann Bootloader-Modus nötig?

- 5-Sek-Fenster zu schnell weg (z. B. Serial-Monitor war noch
  nicht offen, als Reset gedrückt wurde)
- ESP32 "bootloop" – startet ständig neu
- Firmware reagiert nicht auf Befehle
- Seriennummer-Reset nach `factory_reset`

## Siehe auch

- [esp32-config.md](esp32-config.md) – Konfigurations-Werte
- [debian-setup.md](debian-setup.md) – Debian-Box einrichten
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen und
  Alternativen