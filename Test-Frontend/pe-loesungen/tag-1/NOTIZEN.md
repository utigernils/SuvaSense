# Notizen zu Tag 1 – PE-Lösungen

Diese Notizen erklären die **Design-Entscheidungen** hinter der
Referenz-Implementierung. Lies sie **nachdem** du dein eigenes
Coaching vorbereitet hast – der Vergleich ist lehrreicher als
die Kopie.

## Warum der 5-Sek-Bootloader statt eines "richtigen" Konfig-Tools?

Alternativen wären:

- **Web-Interface** auf dem ESP32 (mDNS-Service) – komfortabel,
  aber benötigt zusätzlichen Code, mehr Speicher, neue Bugs
- **Eigene Android-App mit BLE** – Overkill für ein einmaliges
  Setup
- **Kommandozeilen-Tool via USB** – komplizierter für nicht-
  technische User

**Warum 5-Sek-Fenster gewählt wurde:**

- ESP32 hat keinen Bildschirm, keinen Browser, keine Tastatur
  im Schulungsraum-Setup
- Bootloader-Modus ist eine bewährte ESP32-Technologie
- 5 Sekunden sind kurz genug, um nicht versehentlich
  ausgelöst zu werden, aber lang genug für geübte Hände
- Alternativer GPIO0-Trigger ist Standard bei allen ESP32-Boards

**Fazit:** Das 5-Sek-Fenster ist **nicht schön**, aber es
funktioniert ohne zusätzliche Hardware und ist für Lernende
mit Arduino-Vorerfahrung vertraut.

## Warum JSON-Konfiguration statt eigener Syntax?

Alternativen:

- **Eigene Konfig-Sprache** (z. B. `set broker 192.168.1.50:1883`)
  – erfordert Parser, mehr Code
- **CSV-Zeilen** – schwerer zu parsen mit Quotes und Sonderzeichen
- **TOML/YAML** – grössere Library nötig

**Warum JSON:**

- ArduinoJson ist eine bewährte, kleine Library
- JSON ist Lernenden bereits aus der Theorie (Tag 2) bekannt
- Einfaches Error-Handling (try/catch um `deserializeJson`)
- Erweiterbar ohne Syntax-Änderung

## Warum keine OTA-Updates im Bootcamp?

**OTA (Over-The-Air Updates)** wäre eine sinnvolle Erweiterung
für Produktion. Im Bootcamp:

- Komplexität zu hoch (WiFi-Verbindung, Partitionierung,
  Rollback-Mechanismus)
- Lernende verstehen die Grundlagen besser ohne OTA-Komplexität
- Im Bootcamp-LAN ist USB-Flash einfacher und direkter

**Für nächste Iteration:** OTA-Update als Optional-Feature in
Tag 4 oder als Hausaufgabe.

## Warum WiFi-Passwort im Klartext im NVS?

NVS ist **unverschlüsselt** (nur in ESP32-Variante mit
`nvs_set_blob`). Das ist:

- ✅ Einfach zu implementieren
- ✅ Lernende können das Passwort bei Bedarf manuell ändern
- ❌ **Nicht sicher** – wer physischen Zugriff auf den ESP32 hat,
  kann das Passwort auslesen

**Für Produktion:** NVS-Partition mit `nvs_flash_encrypt` oder
externer Secure-Element (z. B. ATECC608A). Für den Bootcamp
nicht relevant.

## Warum `tcp://` und nicht `ssl://` im Broker-URL?

Wir nutzen **klassisches MQTT über TCP** (Port 1883), nicht
MQTT-over-TLS (Port 8883). Begründungen:

- Bootcamp-LAN ist isoliert (kein Internet)
- TLS braucht Zertifikate – Overhead für eine Demo
- WireShark-Debugging ist einfacher ohne TLS-Verschlüsselung
- Performance: TLS-Handshake kostet auf ESP32 ~2 s

**Für Produktion:** TLS aktivieren, Zertifikate über ein
Provisioning-Tool oder per NVS injecten.

## Warum zwei verschiedene Bootloader-Pfade (5-Sek + GPIO0)?

- **5-Sek-Fenster:** für geplante Konfigurations-Änderungen
- **GPIO0-Trigger:** für Notfälle, wenn das 5-Sek-Fenster zu
  schnell weg war

GPIO0 ist der **Standard-ESP32-Bootloader-Pin**. Wer ein
ESP32-Board hat, weiss das. Die Kombination ist robust.

## Was bewusst NICHT in der Referenz steht

- **Multi-SSID-Support** (z. B. Gast-WLAN + Schulungs-WLAN) –
  zu komplex für Bootcamp
- **WiFi-Reconnect-Logik** mit exponentiellem Backoff – die
  Standard-Firmware hat das, aber Lernende verstehen es nicht
  im Detail
- **NTP-Zeitsync** – `recorded_at` wird vom Backend beim INSERT
  gesetzt, nicht vom Sensor
- **TLS** – siehe oben
- **Sensor-Kalibrierung** – BME680 hat Auto-Kalibrierung,
  VEML7700 nicht relevant, MPU6050 DMP kalibriert sich selbst

## Häufige Anfängerfehler beim 1:1-Coaching

1. **"Das Passwort ist falsch"** – meistens ist es ein
   Tippfehler im SSID-Namen (`SCHULUNGS_WLAN` mit grossem S!)
2. **"Der ESP32 flasht nicht"** – oft ist das USB-Kabel
   schlecht (Ladekabel statt Datenkabel), oder der USB-Hub
   liefert zu wenig Strom
3. **"Broker nicht erreichbar"** – Trainer-VM hat eine andere
   IP als gedacht; `ip a` zeigt die echte
4. **"Sensor liefert keine Daten"** – häufig ist die I2C-Adresse
   falsch (BME680: 0x76 oder 0x77 je nach Modul)

## Lösungs-Varianten, die auch okay wären

- Andere MQTT-Bibliothek statt PubSubClient (z. B. AsyncMqttClient)
- Eigene Konfig-Sprache (siehe oben)
- mDNS-Broker-Discovery statt fester IP
- Web-Interface mit Captive Portal für Erstkonfig

Alle sind **korrekt**, solange das Topic-Schema stabil bleibt.

## Siehe auch

- [esp32-config.md](esp32-config.md) – Konfigurations-Werte
- [debian-setup.md](debian-setup.md) – Debian-Box-Setup
- [config-fenster-befehle.md](config-fenster-befehle.md) – Befehlsliste