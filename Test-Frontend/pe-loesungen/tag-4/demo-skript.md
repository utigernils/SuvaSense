# Tag 4 Referenz – 5-7 Min Demo-Skript

Komplettes Skript für die gemeinsame Demo-Show am Tag 4
Nachmittag (16:30–17:30). Auswendig lernen ist nicht nötig –
lies es 30 Min vorher einmal durch, dann Probe-Demo.

## Vor der Demo (15:30 – 16:00)

- [ ] Laptop-Akku ≥ 80 %
- [ ] Beamer getestet
- [ ] 3 Tabs offen: Terminal, pgAdmin, Browser
- [ ] Schriftgrösse im Terminal ≥ 16 pt
- [ ] Backup-Video auf dem Desktop (für Notfall)
- [ ] Snapshot der VM gemacht
- [ ] Wasser trinken

## Demo-Skript (5–7 Min)

### 0:00 – 0:30 | Begrüssung (30 s)

> "Wir sind das PE-Team. Wir haben diese Woche die Plattform
> gebaut, auf der die AE-Apps laufen. Wir zeigen euch live, wie
> unsere 3 ESP32 alle 10 Sekunden Sensordaten an das SuvaSense-
> Backend schicken."

### 0:30 – 1:30 | Hardware (60 s)

> "Hier sind unsere 3 ESPs mit BME680, MPU6050 und VEML7700.
> Die grüne LED zeigt: online. Die blaue: gerade am publishen."

**Aktion:** Mit dem Finger auf die LEDs der ESPs zeigen, ggf.
kurz einen ESP aus- und einstecken.

### 1:30 – 3:00 | MQTT live (90 s)

**Aktion:** Terminal zeigen, auf dem `mosquitto_sub` läuft.

> "Das hier ist der MQTT-Traffic in Echtzeit. Wir sehen gerade
> 3 Sensoren, die alle 10 s ihre BME680-Daten publishen."

**Auf eine konkrete Message zeigen:**

> "Eine Message enthält die Seriennummer, einen Zeitstempel, und
> das Sensor-Payload – in diesem Fall BME680 mit Temperatur,
> Feuchte, Druck und Gas."

### 3:00 – 4:30 | Backend live (90 s)

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

### 4:30 – 5:30 | DB live (60 s)

**Aktion:** Browser auf pgAdmin.

**Tab links:** `servers` → `SuvaSense Postgres` → `Databases` → `suvasense` → `Tables` → `readings`

**Rechtsklick** auf `readings` → "View/Edit Data" → "All Rows".

> "In pgAdmin seht ihr die Postgres-DB. Jede Zeile ist eine
> Messung. Wir haben jetzt X Readings in der DB, alle sauber
> persistiert."

**Refresh-Button klicken:**

> "Und wenn ich jetzt Refresh drücke, kommt eine neue Zeile dazu –
> gerade eingetroffen, während wir hier reden."

### 5:30 – 6:00 | Fragen (30 s)

> "Fragen?"

Pause. Falls Fragen kommen: kurz beantworten, nicht ausschweifen.
Falls keine: "Danke, das war's von uns." Übergang.

### 6:00 | Übergang

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

- ❌ **Nicht über die Zeit gehen** – 5 Min sind besser als 12 Min
- ❌ **Nicht alle Features zeigen** – 2–3 Highlights, gut
  erklärt, reichen
- ❌ **Nicht die AE-Apps kritisieren** – du lieferst die
  Plattform, sie bauen die Apps
- ❌ **Nicht improvisieren bei Problemen** – Backup-Video zeigen

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

## Siehe auch

- [pe-raumklima-bootcamp/docs/tag-4/hands-on-demo-skript.md](../../../pe-raumklima-bootcamp/docs/tag-4/hands-on-demo-skript.md) – die
  offizielle Lernanleitung
- [pe-raumklima-bootcamp/docs/tag-4/gemeinsame-demo.md](../../../pe-raumklima-bootcamp/docs/tag-4/gemeinsame-demo.md) – die Show
  16:30-17:30
- [backup-pflicht-skript.md](backup-pflicht-skript.md) – Snapshot
  + pg_dump vor der Demo
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen