# Tag 4 Referenz – Backup-Pflicht-Skripte

Snapshots und DB-Backups vor der Demo. Diese Skripte laufen
am Tag 4 Vormittag und sichern den Stand für Notfälle.

## 1. VM-Snapshot (Proxmox-Web-UI, falls VM)

Falls die Debian-Box eine **VM in Proxmox** ist (auch wenn wir
Proxmox nicht aktiv nutzen):

1. Proxmox-Web-UI öffnen (URL vom Trainer)
2. VM auswählen
3. Tab "Snapshot" → "Snapshot erstellen"
4. Name: `pre-tag-4-demo-stable`
5. Beschreibung: `Stresstest bestanden, 3+ Sensoren, Backend OK,
   DB hat Test-Daten, bereit fuer Live-Demo um 16:30`
6. "Erstellen"

**Auf der VM selbst:**

```bash
# Snapshot der VM-Disk (falls direkter Zugriff)
# (meistens nicht noetig, Proxmox macht das)
ls -la /var/lib/libvirt/images/
```

## 2. PostgreSQL pg_dump

```bash
cd ~/SuvaSense
BACKUP_FILE="/tmp/suvasense-backup-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec -T postgres \
  pg_dump -U suvasense suvasense > $BACKUP_FILE

# Komprimieren
gzip $BACKUP_FILE
BACKUP_FILE="${BACKUP_FILE}.gz"

# Groesse anzeigen
ls -lh $BACKUP_FILE

# Inhalt pruefen (sollte CREATE TABLE, INSERT etc. enthalten)
zcat $BACKUP_FILE | head -30
```

**Erwartete Ausgabe:** ~50–200 KB für ein paar Stunden
Stresstest-Daten (je nach Anzahl Sensoren).

## 3. Wiederherstellung aus pg_dump

```bash
# Container stoppen
docker compose stop backend

# Backup einspielen
zcat /tmp/suvasense-backup-20260811-143000.sql.gz | \
  docker compose exec -T postgres \
  psql -U suvasense suvasense

# Backend wieder starten
docker compose start backend

# Verifizieren
docker compose logs --tail=20 backend
```

## 4. Mosquitto-Volume-Backup (Persistenz-File)

```bash
cd ~/SuvaSense

# Mosquitto-Volume backup
docker run --rm \
  -v suvasense_mosquitto_data:/data \
  -v $(pwd):/backup \
  alpine tar cvf /backup/mosquitto-data-$(date +%Y%m%d).tar /data

# Gz
gzip mosquitto-data-*.tar
```

## 5. Backup-Skript-Setup (für tägliche Wiederholung)

In `/usr/local/bin/backup-pg.sh` (einmalig anlegen):

```bash
sudo nano /usr/local/bin/backup-pg.sh
```

Inhalt:

```bash
#!/bin/bash
# SuvaSense Postgres-Backup-Skript
# Aufruf: backup-pg.sh

set -euo pipefail

BACKUP_DIR="/var/backups/suvasense"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/suvasense-${TIMESTAMP}.sql.gz"
LATEST_LINK="$BACKUP_DIR/latest.sql.gz"

# Backup-Verzeichnis anlegen
sudo mkdir -p $BACKUP_DIR

# Container-Name ermitteln
CONTAINER=$(docker compose ps -q postgres 2>/dev/null)
if [ -z "$CONTAINER" ]; then
    echo "Postgres-Container laeuft nicht. Backup abgebrochen."
    exit 1
fi

# pg_dump
docker exec $CONTAINER pg_dump -U suvasense suvasense | gzip > $BACKUP_FILE

# Symlink auf neuestes Backup
sudo ln -sf $(basename $BACKUP_FILE) $LATEST_LINK

# Nur die letzten 7 Backups behalten
ls -t $BACKUP_DIR/suvasense-*.sql.gz | tail -n +8 | xargs -r sudo rm

# Bericht
echo "Backup erstellt: $BACKUP_FILE ($(du -h $BACKUP_FILE | cut -f1))"
echo "Backups total: $(ls $BACKUP_DIR/suvasense-*.sql.gz | wc -l)"
```

Ausführbar machen:

```bash
sudo chmod +x /usr/local/bin/backup-pg.sh
```

Cronjob (täglich 17:00):

```bash
# Crontab editieren
sudo crontab -e

# Diese Zeile hinzufuegen
0 17 * * * /usr/local/bin/backup-pg.sh >> /var/log/backup-pg.log 2>&1
```

## 6. Backup-Strategie im Überblick

| Was | Wie | Wann | Aufbewahrung |
|---|---|---|---|
| VM-Snapshot | Proxmox-Web-UI | Vor Tag 3, vor Tag 4 | 2 Snapshots, jeweils behalten bis Bootcamp-Ende |
| Postgres-Daten | `pg_dump` | Täglich 17:00 (Cron) | 7 Backups (1 Woche) |
| Mosquitto-Data | Volume-Tar | Vor Tag 4 | 1 Backup, behalten |
| Backup-Video | Screen-Recording | Vor Tag 4 Demo | 1 Datei, behalten |
| Git-Repo | GitHub | Permanent | – |

## 7. Wiederherstellung-Szenarien

### Szenario A: Backend-DB ist kaputt, aber Snapshot existiert

```bash
# 1. Container stoppen
cd ~/SuvaSense
docker compose stop backend

# 2. Letztes pg_dump einspielen
LATEST_BACKUP=$(ls -t /var/backups/suvasense/suvasense-*.sql.gz | head -1)
zcat $LATEST_BACKUP | docker compose exec -T postgres \
  psql -U suvasense suvasense

# 3. Backend neu starten
docker compose start backend

# 4. Verifizieren
curl http://localhost:8080/health
```

### Szenario B: Komplette VM ist kaputt, Snapshot existiert

```bash
# In Proxmox-Web-UI: VM auswählen -> Tab "Snapshot" ->
#   "pre-tag-4-demo-stable" -> "Rollback"
# Nach 30-60 s ist die VM wieder im Demo-Stand.
```

### Szenario C: Nur einzelne Tabelle kaputt

```bash
# 1. Tabelle aus Backup extrahieren
zcat /var/backups/suvasense/latest.sql.gz | \
  grep -A 1000 "CREATE TABLE readings" | \
  grep -B 1000 "^$" | head -1000 > /tmp/readings-recovery.sql

# 2. In die DB einspielen
docker compose exec -T postgres \
  psql -U suvasense suvasense < /tmp/readings-recovery.sql

# 3. Verifizieren
docker compose exec postgres psql -U suvasense -d suvasense \
  -c "SELECT COUNT(*) FROM readings;"
```

## 8. Vor der Demo: Backup-Skript laufen lassen

5 Min vor der Demo-Show:

```bash
# 1. Final-Backup
sudo /usr/local/bin/backup-pg.sh

# 2. Backup-Status
ls -lh /var/backups/suvasense/ | tail -5

# 3. Container-Status (sollte 4 running zeigen)
docker compose ps

# 4. Health-Check
curl http://localhost:8080/health
```

## Häufige Probleme

??? failure "pg_dump schlägt fehl: 'permission denied'"
    Backup-File in /tmp schreiben geht, in /var/backups
    braucht sudo. Oder: BACKUP_DIR auf einen Pfad setzen, in
    dem der User schreiben darf.

??? failure "Backup-File ist 0 Bytes gross"
    Postgres lief nicht, oder der User hat keine Rechte. Check:
    `docker compose logs postgres | tail -10`

??? failure "Wiederherstellung schlägt fehl: 'relation already exists'"
    Backup einspielen, ohne erst die Tabelle zu leeren.
    Option: `docker compose down -v && docker compose up -d`
    (Daten weg!) – nur im Notfall.

## Siehe auch

- [demo-skript.md](demo-skript.md) – 5-7 Min Skript
- [stresstest-commands.md](stresstest-commands.md) – Stresstest
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen