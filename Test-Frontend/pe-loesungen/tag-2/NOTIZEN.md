# Notizen zu Tag 2 – PE-Lösungen

Diese Notizen erklären die **Design-Entscheidungen** hinter der
Referenz-Implementierung. Lies sie **nachdem** du dein eigenes
Coaching vorbereitet hast.

## Warum Mosquitto und nicht RabbitMQ / Redis / Kafka?

| Alternative | Vorteil | Warum nicht? |
|---|---|---|
| **Mosquitto** ✅ | Standard im IoT, lightweight, einfach | – |
| RabbitMQ | Mächtig, viele Features | Overkill, AMQP-Lernkurve |
| Redis Pub/Sub | Sehr schnell | Kein QoS, keine Persistenz, mehr in-memory |
| Kafka | High-throughput, durable | Braucht Zookeeper, viel zu komplex |
| VerneMQ | MQTT-Skalierung | Mehr Features = mehr Fehlerquellen |
| HiveMQ | Enterprise-MQTT | Closed-Source, kommerzielle Lizenz |

**Mosquitto** ist für den Bootcamp die richtige Wahl, weil:

- Eine 5-Zeilen-Config reicht für Produktion
- 100 KB Binary läuft auf einem Raspberry Pi
- Standard-Image auf Docker Hub verfügbar
- Lernende können `mosquitto_sub` und `mosquitto_pub` direkt
  lernen und anwenden

## Warum 1883 (TCP) und nicht 8883 (TLS)?

**1883** ist Standard-MQTT ohne Verschlüsselung. **8883** ist
MQTT-over-TLS. Im Bootcamp-LAN:

- ✅ Kein Internet, keine externen Angreifer
- ✅ TLS-Handshake auf ESP32 kostet ~2 s (zu lang für 10-s-Intervall)
- ✅ WireShark-Debugging einfacher ohne Verschlüsselung
- ❌ Nicht produktionsreif – jeder im LAN kann Messages lesen

**Für Produktion:**
- Zertifikate über interne CA ausstellen
- `mosquitto.conf` mit `cafile`, `certfile`, `keyfile` ergänzen
- `require_certificate true`
- ESP32-Konfiguration um `ssl://` statt `tcp://` erweitern

## Warum `allow_anonymous true`?

Für den Bootcamp:
- ✅ Schnell zu starten
- ✅ Keine Token-Verwaltung im 5-Sek-Fenster
- ✅ Lernende sehen sofort Daten

**Nicht** für Produktion. Für Produktion:
- `password_file /etc/mosquitto/passwd`
- `mosquitto_passwd -c /etc/mosquitto/passwd username`
- ESP32 müsste das Passwort mitsetzen (nicht-trivial im 5-Sek-Fenster)

## Warum Persistence an?

Wenn der Mosquitto-Broker neu startet, sind nicht-zugestellte
Messages **weg** – ausser `persistence true`. Im Bootcamp
wichtig, weil:

- Lernende restarten den Container oft
- Live-Demos dürfen nicht abbrechen
- Backend-Restart überlebt (Mosquitto speichert Messages im
  RAM, bis Backend sie abgeholt hat)

**Default-Verhalten ohne `persistence true`:** Messages, die
gerade im RAM sind (nicht zugestellt), sind weg.

## Warum WebSocket-Listener (9001)?

Optional, aber nützlich für:
- Browser-basierte MQTT-Clients (z. B. MQTT.js)
- Web-Demos ohne MQTT-Plugin
- Test mit `curl`-kompatiblen WebSocket-Tools

**Im Bootcamp:** Optional. Wenn der Trainer es aktiviert, können
AE-Teams ihre Web-App direkt im Browser testen, ohne die
REST-API.

## Warum keine QoS-2 im Bootcamp?

QoS 2 (exactly-once) braucht 4 Messages (PUBLISH, PUBREC,
PUBREL, PUBCOMP) statt 2 bei QoS 1. Für 10-s-Intervall:
- QoS 1: 2 Messages × 5 Sensoren × 6/Min = 60/Min
- QoS 2: 4 Messages × 5 Sensoren × 6/Min = 120/Min

Verdoppelter Broker-Load, doppelte Backend-Persistenz-Pfade.
**Im Bootcamp-LAN OK, im Produktions-Massstab problematisch.**

**Doppelte Messages** (QoS 1 möglich) werden in der DB mit
`ON CONFLICT DO NOTHING` abgefangen – siehe Tag-3-Lösungen.

## Warum 10-s-Publish-Intervall?

Kompromiss:

- **Schneller** (1 s) → feinere Auflösung, mehr Last auf Broker
  und DB
- **Langsamer** (60 s) → weniger Last, aber langsame Reaktion
  auf Veränderungen

10 s = 6 Messages/Min/Sensor. Bei 5 Sensoren = 30 Messages/Min.
Broker und DB können das locker. AE-Apps sehen "fast live".

## Was bewusst NICHT in der Referenz steht

- **TLS** – siehe oben
- **Authentifizierung mit Zertifikaten** – X.509-Client-Certs
  sind Overkill für Bootcamp
- **Multi-Broker-Cluster** – für Hochverfügbarkeit, nicht Bootcamp
- **MQTT-SN** (Sensor-Network-Variante) – für nicht-TCP-fähige
  Geräte
- **WebSocket-Secured (WSS)** – TLS auf WebSocket

## Häufige Anfängerfehler beim 1:1-Coaching

1. **"Der Broker startet nicht"** – Syntaxfehler in der Config
   oder fehlende Permissions auf `/var/lib/mosquitto`
2. **"Mein ESP connected nicht"** – Broker-IP aus Sicht des
   ESP32 prüfen, **nicht** `localhost` (das ist der ESP selbst)
3. **"Messages kommen nicht an"** – Topic-Tippfehler, mit `-v`
   prüfen
4. **"Mosquitto speichert keine Messages"** – `persistence
   false` oder falsches Verzeichnis

## Lösungs-Varianten, die auch okay wären

- Andere MQTT-Bibliothek (z. B. HiveMQ statt Mosquitto) – aber
  komplexer
- TLS-Konfiguration – aber im Bootcamp nicht noetig
- Multi-Broker-Setup – aber Overkill

Alle sind **korrekt**, solange Topic-Schema stabil bleibt.

## Siehe auch

- [mosquitto-config.md](mosquitto-config.md) – Config-Datei
- [netzwerk-static-ip.md](netzwerk-static-ip.md) – Netzwerk
- [docker-quick-ref.md](docker-quick-ref.md) – Docker-Befehle
- [pe-raumklima-bootcamp/docs/projekt/mqtt-vertrag.md](../../../pe-raumklima-bootcamp/docs/projekt/mqtt-vertrag.md) – Topic-Schema