# Backup-Pflicht-Skript (Trainer-Referenz)

Snapshots und DB-Backups vor der Demo-Show. Diese Befehle 30 Min
vor der Show ausführen, damit im Notfall alles wiederherstellbar
ist.

## 1. pg_dump der Postgres-DB (5 s)

```bash
# In den SuvaSense-Stack-Ordner
cd ~/SuvaSense

# Backup-Datei mit Zeitstempel
BACKUP_FILE="/tmp/suvasense-backup-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec -T postgres pg_dump -U suvasense suvasense > $BACKUP_FILE

# Komprimieren
gzip $BACKUP_FILE
BACKUP_FILE="${BACKUP_FILE}.gz"

# Verifizieren (Größe sollte > 1 KB sein)
ls -lh $BACKUP_FILE
echo "Backup: $BACKUP_FILE"
```

**Wiederherstellung** (nur im Notfall!):

```bash
cd ~/SuvaSense
# Container stoppen
docker compose stop backend

# Backup einspielen
zcat /tmp/suvasense-backup-YYYYMMDD-HHMMSS.sql.gz | \
  docker compose exec -T postgres psql -U suvasense suvasense

# Backend wieder starten
docker compose start backend
```

## 2. Timeshift-Snapshot der Debian-Box (30 s)

```bash
# Timeshift installieren (falls nicht vorhanden)
sudo apt install -y timeshift

# Snapshot erstellen
sudo timeshift --create --comments "Tag 4 Demo-Snapshot"
```

**Was Timeshift speichert:**

- Systemdateien (`/etc`, `/var`, `/usr/local`)
- User-Konfigurationen
- Installierte Pakete
- **NICHT:** Docker-Volumes (die werden separat gesichert)

## 3. Docker-Volume-Snapshot (1 Min)

```bash
# Postgres-Daten-Volume snapshot
docker run --rm \
  -v suvasense_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar cvf /backup/postgres-volume-$(date +%Y%m%d).tar /data

# Mosquitto-Daten-Volume snapshot (Persistenz-File)
docker run --rm \
  -v suvasense_mosquitto_data:/data \
  -v $(pwd):/backup \
  alpine tar cvf /backup/mosquitto-volume-$(date +%Y%m%d).tar /data
```

## 4. Backup-Übersicht-Datei (für Restore)

Erstelle `/root/backup-info.txt` mit den Pfaden:

```bash
cat > /root/backup-info.txt <<EOF
=== SuvaSense Backup Info ===
Erstellt: $(date)

DB-Backup:
  $(ls -lh /tmp/suvasense-backup-*.sql.gz | tail -1)

Timeshift-Snapshot:
  $(sudo timeshift --list 2>/dev/null | tail -1)

Docker-Volumes:
  $(ls -lh postgres-volume-*.tar 2>/dev/null | tail -1)
  $(ls -lh mosquitto-volume-*.tar 2>/dev/null | tail -1)

Restore-Befehle:
  cd ~/SuvaSense
  docker compose stop backend
  zcat /tmp/suvasense-backup-YYYYMMDD.sql.gz | \
    docker compose exec -T postgres psql -U suvasense suvasense
  docker compose start backend
EOF

cat /root/backup-info.txt
```

## 5. Backup-Video (Demo-Sicherung)

Vor der Demo-Show, **30 s Bildschirm-Aufnahme** machen:

**Unter Linux mit `ffmpeg`:**

```bash
# ffmpeg installieren
sudo apt install -y ffmpeg

# 30 s Bildschirm-Aufnahme
ffmpeg -video_size 1920x1080 -framerate 25 -f x11grab -i :0.0 \
  -t 30 -c:v libx264 backup-demo-$(date +%Y%m%d).mp4
# Nach 30 s automatisch beendet. Datei liegt im aktuellen Ordner.
```

**Unter macOS mit QuickTime:**

1. QuickTime öffnen
2. `Cmd + Shift + 5` → Bildschirm-Aufnahme
3. Demo-Skript einmal durchlaufen
4. Aufnahme beenden, Datei speichern

**Unter Windows:**

1. `Win + G` → Game Bar
2. Demo-Skript durchlaufen
3. Aufnahme beenden

**Was das Backup-Video enthalten sollte:**

- Live-Browser mit der App (Demo-Modus)
- Terminal mit `mosquitto_sub` (Traffic sichtbar)
- Terminal mit `curl /api/v1/sensors` (Daten sichtbar)
- pgAdmin mit der readings-Tabelle

**Speicherort:** Desktop, leichter Name wie `demo-backup-2026-08-11.mp4`

## 6. Backup-Strategie-Übersicht (vor Tag 4)

| Backup | Wann | Wohin | Restore-Zeit |
|---|---|---|---|
| pg_dump | 30 Min vor Demo | `/tmp/suvasense-backup-*.sql.gz` | 5 Min |
| Timeshift | 30 Min vor Demo | `/timeshift/snapshots/` | 1 Min |
| Docker-Volumes | 30 Min vor Demo | `/backup/postgres-volume-*.tar` | 5 Min |
| Backup-Video | 30 Min vor Demo | `~/Desktop/demo-backup-*.mp4` | 0 s (Play) |

## Häufige Fehler

??? failure "pg_dump schlägt fehl: 'permission denied'"
    Backup-File in `/tmp` schreiben geht, in `/var/backups`
    braucht `sudo`. Lösung: `cd /tmp` oder `BACKUP_FILE=/tmp/...`.

??? failure "Timeshift nicht installiert"
    `sudo apt install -y timeshift` (Debian/Ubuntu) oder
    `sudo dnf install timeshift` (Fedora).

??? failure "Docker-Volume-Snapshot: 'no such file or directory'"
    Volume-Name prüfen mit `docker volume ls`. Korrekter Name ist
    `suvasense_postgres_data` (aus dem Compose-Namen + Service).

## Vor der Demo-Show (5 Min)

Schnellcheck, ob alle Backups vorhanden sind:

```bash
# 1. DB-Backup prüfen
ls -lh /tmp/suvasense-backup-*.sql.gz | tail -1
# Sollte eine .gz-Datei > 1 KB zeigen

# 2. Timeshift-Snapshot prüfen
sudo timeshift --list | tail -1
# Sollte den heutigen Snapshot zeigen

# 3. Docker-Volumes prüfen
ls -lh ~/SuvaSense/postgres-volume-*.tar ~/SuvaSense/mosquitto-volume-*.tar 2>/dev/null
# Sollte 2 tar-Dateien zeigen

# 4. Backup-Video prüfen
ls -lh ~/Desktop/demo-backup-*.mp4 2>/dev/null || ls -lh demo-backup-*.mp4 2>/dev/null
# Sollte eine .mp4-Datei zeigen

# 5. Container-Status (vor Demo)
docker compose -C ~/SuvaSense ps
# 4 Services "running"
```
