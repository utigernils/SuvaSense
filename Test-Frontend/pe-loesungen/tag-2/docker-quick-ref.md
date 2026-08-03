# Tag 2 Referenz – Docker-Befehle (Spickzettel)

Alle Befehle, die du im Bootcamp brauchst, auf einer Seite.
Falls du eine ausführliche Erklärung brauchst: `--help` oder
die offizielle Docker-Doku.

## Container-Lifecycle

```bash
# Container starten (im Hintergrund)
docker compose up -d

# Container stoppen (Container bleiben erhalten)
docker compose stop

# Container stoppen UND entfernen
docker compose down

# Container stoppen UND Volumes (Daten!) entfernen
# ACHTUNG: DB-Inhalte gehen verloren!
docker compose down --volumes

# Nur Container neu erstellen (z. B. nach Config-Aenderung)
docker compose up -d --force-recreate

# Image neu bauen UND Container neu starten
docker compose up -d --build

# Container neu starten (z. B. nach Crash)
docker compose restart <service>
# z. B.: docker compose restart backend
```

## Status und Logs

```bash
# Status aller Services (Tabelle)
docker compose ps

# Live-Status mit Ressourcen (RAM, CPU, Netzwerk)
docker stats

# Logs eines Services
docker compose logs <service>
# z. B.: docker compose logs backend

# Live-Logs (follow, Ctrl+C zum Beenden)
docker compose logs -f <service>

# Letzte 100 Zeilen
docker compose logs --tail=100 <service>

# Logs mit Zeitstempel
docker compose logs -t <service>

# Logs seit 5 Minuten
docker compose logs --since 5m <service>
```

## In Container reingehen

```bash
# Shell in Container starten
docker compose exec <service> sh
# z. B.: docker compose exec backend sh

# Einzelnen Befehl in Container ausfuehren
docker compose exec postgres psql -U suvasense -d suvasense

# Als root in Container
docker compose exec -u root backend sh
```

## Container und Images

```bash
# Lokale Images anzeigen
docker images

# Laufende Container anzeigen (auch ohne compose)
docker ps

# Alle Container (laufend + gestoppt)
docker ps -a

# Container-Logs (auch ohne compose)
docker logs <container-name>

# Container-Stats einmal anzeigen (nicht live)
docker stats --no-stream
```

## Volumes und Daten

```bash
# Volumes auflisten
docker volume ls

# Volume inspizieren
docker volume inspect <volume-name>

# In Volume reingucken (am Mount-Pfad)
ls -la /var/lib/docker/volumes/<volume-name>/_data
```

## Netzwerk

```bash
# Docker-Netzwerke auflisten
docker network ls

# Container in einem Netz inspizieren
docker network inspect <network-name>

# In Container IP-Adresse sehen
docker compose exec <service> hostname -i
```

## Image-Management

```bash
# Images pullen
docker compose pull

# Images bauen
docker compose build
# oder
docker compose build <service>

# Verwaiste Images aufräumen
docker image prune

# Komplette Aufräumaktion (Vorsicht!)
docker system prune
# Mit 'y' bestaetigen
```

## Backup (Postgres-DB)

```bash
# Dump der DB
docker compose exec -T postgres pg_dump -U suvasense suvasense > backup.sql

# Wiederherstellen
cat backup.sql | docker compose exec -T postgres psql -U suvasense suvasense
```

## Volumes-Backup

```bash
# Backup der Postgres-Daten (im Volume)
docker compose exec -T postgres bash -c 'pg_dump -U suvasense suvasense' > backup.sql

# Oder direkt vom Host (falls Volume gemountet)
docker run --rm -v <volume-name>:/data -v $(pwd):/backup \
    alpine tar cvf /backup/postgres-volume.tar /data
```

## Häufige Befehle-Kombinationen

**Stack-Status prüfen:**
```bash
docker compose ps && docker stats --no-stream
```

**Logs aller Services gleichzeitig (interleaved):**
```bash
docker compose logs -f
```

**Container manuell neu starten und Logs anschauen:**
```bash
docker compose restart backend && docker compose logs -f backend
```

**In Postgres-DB schauen:**
```bash
docker compose exec postgres psql -U suvasense -d suvasense -c '\dt'
# Zeigt alle Tabellen
```

**In Backend-Container eine Datei anschauen:**
```bash
docker compose exec backend cat /app/config.yaml
```

## Häufige Probleme

??? failure "`docker compose up` schlägt fehl mit 'port already in use'"
    Wer nutzt den Port? `sudo ss -tlnp | grep 8080`. Lösung:
    anderen Port in `docker-compose.yml` wählen.

??? failure "Container startet ständig neu"
    `docker compose logs <service>` zeigt den Fehler. Häufig:
    Syntaxfehler in Config, fehlende Datei, falsche Env-Variable.

??? failure "Image 'xyz' not found"
    `docker compose pull` oder Image-Name prüfen (Tippfehler?).

??? failure "Permission denied beim Volume-Mount"
    Host-Verzeichnis hat falsche Permissions. `sudo chown -R
    1000:1000 /path/to/host/dir` (User 1000 ist oft der
    Container-User).

## Siehe auch

- [pe-raumklima-bootcamp/docs/tag-3/theorie-docker.md](../../../pe-raumklima-bootcamp/docs/tag-3/theorie-docker.md) – Docker-Theorie
- [mosquitto-config.md](mosquitto-config.md) – Mosquitto-Config
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen