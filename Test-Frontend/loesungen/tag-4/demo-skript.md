# Demo-Skript (5–7 Min, Trainer-Referenz)

Komplettes Skript für die gemeinsame Demo-Show am Tag 4 Nachmittag
(16:30–17:30) – für die PE-Präsentation. Auswendig lernen ist
nicht nötig; lies es 30 Min vorher einmal durch.

## 0:00 – 0:30 | Wer wir sind (30 s)

> "Wir sind das PE-Team. Wir haben diese Woche die Plattform
> gebaut, auf der die AE-Apps laufen. Wir zeigen euch live, wie
> unsere 3 ESP32 alle 10 Sekunden Sensordaten an das SuvaSense-
> Backend schicken."

## 0:30 – 1:30 | Hardware (60 s)

> "Hier sind unsere 3 ESPs mit BME680, MPU6050 und VEML7700.
> Die grüne LED zeigt: online. Die blaue: gerade am publishen."

**Aktion:** Mit dem Finger auf die LEDs der ESPs zeigen, ggf.
kurz einen ESP aus- und einstecken.

## 1:30 – 3:00 | MQTT live (90 s)

**Aktion:** Terminal zeigen, auf dem `mosquitto_sub` läuft.

> "Das hier ist der MQTT-Traffic in Echtzeit. Wir sehen gerade
> 3 Sensoren, die alle 10 s ihre BME680-Daten publishen."

**Auf eine konkrete Message zeigen:**

> "Eine Message enthält die Seriennummer, einen Zeitstempel, und
> das Sensor-Payload – in diesem Fall BME680 mit Temperatur,
> Feuchte, Druck und Gas."

## 3:00 – 4:30 | Backend live (90 s)

**Aktion:** Zweites Terminal, `curl`-Befehle.

```bash
# Liste aller Sensoren
curl -s http://localhost:8080/api/v1/sensors | python3 -m json.tool | head -30
```

> "Das Backend persistiert jede MQTT-Message in Postgres und
> stellt eine REST-API für die AE-Apps bereit. Hier seht ihr die
> Liste der Sensoren."

```bash
# Letzte 3 Messungen
curl -s "http://localhost:8080/api/v1/sensors/SN12345/readings?page=1&page_size=3" | python3 -m json.tool
```

> "Die letzten 3 Messungen des ersten Sensors, im Push-Bundle-
> Format. Die AE-Apps nutzen exakt diese Endpoints."

## 4:30 – 5:30 | DB live (60 s)

**Aktion:** Browser auf pgAdmin.

**Tab links:** `servers` → `SuvaSense Postgres` → `Databases` →
`suvasense` → `Tables` → `readings`

**Rechtsklick** auf `readings` → "View/Edit Data" → "All Rows".

> "In pgAdmin seht ihr die Postgres-DB. Jede Zeile ist eine
> Messung. Wir haben jetzt X Readings in der DB, alle sauber
> persistiert."

**Refresh-Button klicken:**

> "Und wenn ich jetzt Refresh drücke, kommt eine neue Zeile dazu –
> gerade eingetroffen, während wir hier reden."

## 5:30 – 6:00 | Fragen (30 s)

> "Fragen?"

Pause. Falls Fragen kommen: kurz beantworten, nicht ausschweifen.
Falls keine: "Danke, das war's von uns." Übergang.

## 6:00 | Übergang

> "Die AE-Apps sind jetzt live auf unserer Plattform. Wir
> bleiben hier für Support. Während die AE-Teams präsentieren,
> bin ich ansprechbar bei technischen Fragen."

## Backup-Pläne (Spickzettel)

| Was kann kaputtgehen? | Backup-Plan |
|---|---|
| Backend crasht | `docker compose restart backend` (5 s) |
| pgAdmin zeigt nichts | "Ist nur das UI, Daten sind da" → Backend-Health zeigen |
| Komplette Plattform down | Backup-Video zeigen (30 s vom Vorabend) |
| Live-`curl` zeigt nichts | Auf `mosquitto_sub` wechseln, "Broker zeigt Messages" |
| Daten-Inkonsistenz (z. B. 5 statt 6 Messages) | "QoS-1 Redelivery, ist normal" |

## Was du NICHT tust

- ❌ **Nicht über die Zeit gehen** – 5–7 Min sind Maximum
- ❌ **Nicht alle Features zeigen** – lieber 2–3 Highlights, gut
  erklärt
- ❌ **Die AE-Apps kritisieren** – du lieferst die Plattform, sie
  bauen die Apps
- ❌ **Improvisieren bei Problemen** – Backup-Video zeigen

## Häufige Probleme live

??? failure "Terminal-Schrift zu klein im Beamer"
    Vor der Demo testen. Hell auf dunkel ist besser lesbar.
    Schriftgrösse 18–20 pt einstellen.

??? failure "Live-Demo crasht beim ersten `curl`"
    Backup-Video zeigen. "Live-Systeme sind live. Hier ist ein
    Backup von gestern Abend, alle Features funktionieren dort."

??? failure "AE-Teams im Publikum unterbrechen"
    "Bitte Fragen aufsparen bis nach der Präsentation – wir haben
    nur 5 Min."

## Probe-Demo (30 Min vorher)

Laufe das Skript **einmal komplett durch**, bevor die echte
Demo losgeht. Achte auf:

- **Timing:** wie lange brauchst du wirklich? 5 Min? 7 Min?
  Anpassen, falls nötig.
- **Übergänge:** wo klickst du? Welche Tabs sind offen?
  Vorbereiten.
- **Peinlichkeiten:** Funktioniert alles? Oder crasht eine
  Demo-Komponente?

!!! warning "Probe-Demo ist Pflicht"
    Eine "Live-Demo" ohne Probe ist Glücksspiel. Eine
    "Probe-Demo" 30 Min vorher: 7 Min Aufwand, 60 Min Chaos
    verhindert.

## Vor der Demo (15:30)

- [ ] Laptop-Akku ≥ 80 % (oder am Strom)
- [ ] Beamer getestet (Auflösung 1920×1080, gespiegelt)
- [ ] 3 Tabs offen: Terminal, pgAdmin, Browser
- [ ] Schrift im Terminal ≥ 18 pt
- [ ] Backup-Video auf dem Desktop
- [ ] Snapshot der Debian-Box gemacht
- [ ] `pg_dump` der DB als Backup
- [ ] Wasser in der Nähe (trockener Mund beim Reden!)

## Check vor der Show (5 Min)

```bash
# 1. Stack-Status
docker compose ps
# 4 Services sollten "running" sein

# 2. Health-Check
curl http://localhost:8080/health
# 200 OK

# 3. Live-Daten
mosquitto_pub -h localhost -t suva/CHECK-001/data -m \
  '{"bme680":{"temp":22,"hum":50,"press":1013,"gas":145}}'
# Sollte im 'mosquitto_sub'-Output erscheinen

# 4. DB-Count (sollte > 0 sein wenn Test-Sensoren publishen)
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT COUNT(*) FROM readings;"
```
