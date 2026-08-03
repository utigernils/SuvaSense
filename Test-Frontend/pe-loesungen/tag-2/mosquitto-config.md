# Tag 2 Referenz – Mosquitto-Konfiguration

Vollständige `mosquitto.conf` für den Bootcamp. Persistenz
ist eingeschaltet, damit Messages einen Backend-Restart
überleben.

## Datei: `/etc/mosquitto/conf.d/bootcamp.conf`

```conf
# ============================================================
# Mosquitto Broker Config – PE Bootcamp
# ============================================================
#
# Diese Config wird in /etc/mosquitto/conf.d/ gelegt.
# Mosquitto liest alle *.conf-Dateien in diesem Verzeichnis
# automatisch (zusätzlich zu mosquitto.conf).
#
# Nach Aenderungen: sudo systemctl restart mosquitto
# ============================================================

# --- Listener ---
# Standard-Listener auf Port 1883, alle Interfaces
listener 1883 0.0.0.0

# Optional: WebSocket-Listener auf 9001 (fuer Browser-Clients)
listener 9001 0.0.0.0
protocol websockets

# --- Authentifizierung ---
# Anonymer Zugriff erlaubt (fuer Bootcamp-LAN OK)
allow_anonymous true

# Fuer Produktion: User mit Passwort
# password_file /etc/mosquitto/passwd

# --- Persistenz ---
# Nachrichten im RAM halten, bis Subscriber sie bekommen
# Auch bei Backend-Restart keine Messages verlieren
persistence true
persistence_location /var/lib/mosquitto/

# Max 1 GB Persistenz-File (default ist begrenzt)
# autosave_interval 30  # alle 30 Sekunden speichern

# --- Logging ---
# Nur Warnings und Errors (sonst zu viel Output)
log_type warning
log_type error
log_type notice
log_type information

log_dest stdout
log_dest syslog

# --- Limits ---
# Max Anzahl gleichzeitiger Clients
max_connections 100

# Maximal 1000 Messages pro Sekunde (Schutz vor Flood)
# message_rate_limit 1000

# QoS 1 + 2 Messages muessen bestaetigt werden
# max_inflight_messages 20
# max_queued_messages 1000
```

## Setup-Schritte

```bash
# 1. Datei anlegen
sudo nano /etc/mosquitto/conf.d/bootcamp.conf
# (Inhalt oben einfuegen)

# 2. Speichern: Ctrl+O, Enter, Ctrl+X

# 3. Persistenz-Verzeichnis sicherstellen
sudo mkdir -p /var/lib/mosquitto
sudo chown mosquitto:mosquitto /var/lib/mosquitto

# 4. Service restarten
sudo systemctl restart mosquitto

# 5. Status pruefen
sudo systemctl status mosquitto
# Sollte zeigen: active (running), ohne Errors

# 6. Port-Check
sudo ss -tlnp | grep 1883
# Sollte zeigen: LISTEN 0  100  *:1883  ...
```

## Testen

```bash
# Publisher
mosquitto_pub -t suva/TEST/data -m '{"bme680":{"temp":22,"hum":50}}'

# Subscriber (in zweitem Terminal)
mosquitto_sub -t 'suva/+/data' -v
# Sollte zeigen: suva/TEST/data {"bme680":...}
```

## Wichtige Befehle

```bash
# Status
sudo systemctl status mosquitto
sudo journalctl -u mosquitto -f

# Start/Stop/Restart
sudo systemctl start mosquitto
sudo systemctl stop mosquitto
sudo systemctl restart mosquitto

# Config-Test (Syntax-Check)
sudo mosquitto -c /etc/mosquitto/mosquitto.conf -t

# Aktive Clients
mosquitto_sub -t '$SYS/broker/clients/connected' -v
```

## TLS-Konfiguration (für Produktion, NICHT Bootcamp)

```conf
# Zertifikate generieren mit openssl
# (nur Demo, fuer Produktion echte CA verwenden)

listener 8883
cafile /etc/mosquitto/ca_cert.pem
certfile /etc/mosquitto/server_cert.pem
keyfile /etc/mosquitto/server_key.pem
require_certificate true
```

Im Bootcamp **nicht** aktivieren – wir nutzen das offene
Bootcamp-LAN.

## Häufige Fehler

| Fehler | Ursache | Lösung |
|---|---|---|
| `Error: Address already in use` | Port 1883 belegt | `sudo lsof -i :1883` |
| `Permission denied on /var/lib/mosquitto` | Falscher Owner | `sudo chown mosquitto:mosquitto /var/lib/mosquitto` |
| Config-Syntax-Fehler | mosquitto startet nicht | `sudo mosquitto -c ... -t` zeigt Fehler |
| ESP32 connected nicht | `allow_anonymous false` aber kein Passwort | Auf `allow_anonymous true` setzen |
| Messages kommen nicht an | Topic-Tippfehler | Subscriber mit `-v` zeigt Topic |

## Siehe auch

- [pe-raumklima-bootcamp/docs/tag-2/hands-on-broker.md](../../../pe-raumklima-bootcamp/docs/tag-2/hands-on-broker.md) – die
  offizielle Lernanleitung
- [netzwerk-static-ip.md](netzwerk-static-ip.md) – statische IP
  auf der Box
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen