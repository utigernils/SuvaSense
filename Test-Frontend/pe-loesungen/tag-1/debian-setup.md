# Tag 1 Referenz – Debian-Box vorbereiten

Schritt-für-Schritt-Anleitung für die Trainer-Box (Debian 12
Bookworm) im Bootcamp. Lernende führen dasselbe Setup auf
ihren eigenen Boxen durch.

## Grundinstallation (falls Box nicht vorkonfiguriert)

```bash
# Als root einloggen
sudo -i

# System aktualisieren
apt update && apt upgrade -y

# SSH installieren (falls nicht da)
apt install -y openssh-server
systemctl enable --now sshd

# Root-Login per SSH erlauben (nur Bootcamp-LAN OK)
sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
systemctl restart sshd

# Standard-Tools
apt install -y curl wget git vim htop net-tools
```

## Statische IP setzen

```bash
cat > /etc/network/interfaces.d/eth0 <<EOF
auto eth0
iface eth0 inet static
    address 192.168.1.50
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 192.168.1.1 1.1.1.1
EOF
systemctl restart networking
```

Welche IP du bekommst, ist mit dem Trainer abgesprochen.
Typische IPs im Bootcamp:

| Gruppe | IP | Hostname |
|---|---|---|
| 1 | 192.168.1.50 | pe-vm-01 |
| 2 | 192.168.1.51 | pe-vm-02 |
| 3 | 192.168.1.52 | pe-vm-03 |

## Docker installieren

```bash
# Docker-Repo hinzufügen (falls nicht schon da)
curl -fsSL https://get.docker.com | sh

# Test
docker --version
docker compose version

# Aktueller User zur Docker-Gruppe hinzufügen
usermod -aG docker $USER
# WICHTIG: danach AUSLOGGEN und neu einloggen

# Test (nach Re-Login)
docker ps
```

## SuvaSense-Repo klonen

```bash
cd /opt
git clone https://github.com/HeiligerG/SuvaSense.git
cd SuvaSense

# Optional: in /opt verschieben für einfacheren Zugriff
```

## Wichtige Ports prüfen

```bash
# Welche Ports sind frei?
sudo ss -tlnp | grep -E '8080|1883|9001|5050|5432'
```

Falls einer belegt ist, finde den Übeltäter:

```bash
sudo lsof -i :8080
# PID und Prozess anzeigen
```

## SSH-Schlüssel-basierte Auth (optional, komfortabler)

Auf deinem Laptop (nicht der Debian-Box):

```bash
ssh-keygen -t ed25519 -C "trainer@pe-bootcamp"
# speichert unter ~/.ssh/id_ed25519

# Public-Key auf die Box kopieren
ssh-copy-id root@192.168.1.50

# Test (sollte ohne Passwort gehen)
ssh root@192.168.1.50
```

## Snapshot erstellen (vor Tag 3)

Falls du eine VM-Umgebung nutzt, in der Proxmox-Web-UI:

1. VM auswählen → Tab "Snapshot" → "Snapshot erstellen"
2. Name: `pre-tag-3-clean-debian`
3. Beschreibung: `Debian 12 + Docker + SuvaSense-Repo, ready for Tag 3`
4. Erstellen

So kannst du jederzeit zu diesem Stand zurückkehren, falls
Tag 3 etwas kaputt macht.

## pg_dump als Backup (vor Tag 3)

Auch ohne laufendes Backend kannst du `pg_dump` für die
Datenbank vorbereiten:

```bash
# Skript erstellen
cat > /usr/local/bin/backup-pg.sh <<'EOF'
#!/bin/bash
# Backup der SuvaSense-DB
cd /opt/SuvaSense
BACKUP_FILE="/tmp/suvasense-backup-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec -T postgres pg_dump -U suvasense suvasense > $BACKUP_FILE
gzip $BACKUP_FILE
echo "Backup: ${BACKUP_FILE}.gz"
EOF
chmod +x /usr/local/bin/backup-pg.sh
```

Aufruf später:

```bash
backup-pg.sh
# → /tmp/suvasense-backup-20260810-150000.sql.gz
```

## Vorbereitete Snapshot-Konfiguration

Wenn du am Tag 1 mehrere Debian-Boxen parallel aufsetzt,
empfehle ich diese **Setup-Standardisierung**:

```bash
# /etc/profile.d/bootcamp.sh
cat > /etc/profile.d/bootcamp.sh <<'EOF'
export PS1='\[\033[01;32m\]\u@pe-\h\[\033[00m\]:\w\$ '
alias ll='ls -lah'
alias dc='docker compose'
alias dcl='docker compose logs -f'
alias dcp='docker compose ps'
alias mos='mosquitto_pub -h localhost -t'
alias moss='mosquitto_sub -h localhost -t'
EOF
```

Alle User in der Box sehen beim nächsten Login diese bequemen
Aliase (`dc` statt `docker compose`, `dcl` statt
`docker compose logs -f`, etc.).

## Wichtige Befehle (Spickzettel)

```bash
# Container-Status
docker compose ps

# Logs eines Services
docker compose logs -f backend

# In Container reingehen
docker compose exec postgres psql -U suvasense -d suvasense

# Container neu starten
docker compose restart backend

# IP-Adresse anzeigen
ip a

# Welche Prozesse laufen?
ps aux | head

# Disk-Platz prüfen
df -h
```

## Häufige Probleme

??? failure "Kein Internet in der VM"
    Proxmox-Bridge-Konfiguration prüfen. Sollte `vmbr0` sein,
    Gateway `192.168.1.1`. Vom Host aus: `ip route` zeigt die
    aktive Route.

??? failure "`docker compose` schlägt fehl mit 'command not found'"
    Alte Docker-Version (< 20.10) ohne Compose-Plugin. Update:
    `apt install docker-compose-plugin` ODER Repo hinzufügen.

??? failure "`docker ps` zeigt 'permission denied' trotz usermod"
    Shell hat die Gruppenmitgliedschaft noch nicht. **Ausloggen
    und neu einloggen** (nicht nur neues Terminal). Oder:
    `newgrp docker`.

## Siehe auch

- [pe-raumklima-bootcamp/docs/tag-1/hands-on-debian.md](../../../pe-raumklima-bootcamp/docs/tag-1/hands-on-debian.md) – die
  offizielle Lernanleitung
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen und
  Alternativen