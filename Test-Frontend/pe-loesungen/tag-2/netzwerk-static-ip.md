# Tag 2 Referenz – Statische IP und Netzwerk

## Statische IP auf der Debian-Box

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

Verifizieren:

```bash
ip a
# Sollte zeigen: eth0 ... inet 192.168.1.50/24

ip route
# Sollte zeigen: default via 192.168.1.1 dev eth0

ping 192.168.1.1   # Router
ping 1.1.1.1       # Internet (DNS-Test)
```

## DHCP-Probleme diagnostizieren

```bash
# Welche IP hat der DHCP-Server zugewiesen?
cat /var/lib/dhcp/dhclient.eth0.leases | grep "fixed-address"

# DHCP komplett neu anfordern
sudo dhclient -r eth0 && sudo dhclient eth0
```

Falls die Debian-Box keine IP bekommt:

```bash
# Prüfe, ob DHCP-Requests gesendet werden
sudo tcpdump -i eth0 -n port 67 or port 68
# (auf einem anderen Terminal)

# Manuell eine Adresse setzen (Fallback)
sudo ip addr add 192.168.1.50/24 dev eth0
sudo ip route add default via 192.168.1.1
```

## NetworkManager-Konflikt (Debian 11+)

Auf neueren Debian-Versionen kann NetworkManager die
`/etc/network/interfaces`-Konfiguration überschreiben.

```bash
# NetworkManager-Status
systemctl status NetworkManager

# Falls aktiv, die Interface-Verwaltung deaktivieren
sudo nmcli device set eth0 managed no
sudo systemctl restart NetworkManager

# Oder NetworkManager komplett ausschalten (fuer Server OK)
sudo systemctl disable --now NetworkManager
```

Danach `systemctl restart networking` sollte funktionieren.

## Hostname setzen

```bash
sudo hostnamectl set-hostname pe-vm-01
# Aenderungen sichtbar nach Logout/Login
```

## DNS konfigurieren

In `/etc/resolv.conf`:

```
nameserver 192.168.1.1
nameserver 1.1.1.1
```

Falls `resolvconf` automatisch überschreibt (z. B. mit DHCP):

```bash
# /etc/resolvconf/resolv.conf.d/base
sudo nano /etc/resolvconf/resolv.conf.d/base
# nameserver 1.1.1.1
# nameserver 8.8.8.8
sudo resolvconf -u
```

## WLAN der Sensoren im Schulungsraum

**Kanal-Wahl:**

| Kanal | Frequenz | Bemerkung |
|---|---|---|
| 1 | 2.412 GHz | oft von Nachbarn genutzt |
| 6 | 2.437 GHz | **empfohlen im Bootcamp** |
| 11 | 2.462 GHz | oft frei |

**Welche APs sind verfügbar?** Mit dem Handy scannen (Android:
WiFi Analyzer, iOS: Airport Utility).

Falls viele APs in der Umgebung: `iwlist wlan0 scan` (auf einem
Laptop mit WLAN) zeigt alle sichtbaren APs inkl. Kanal.

## Bridge-Konfiguration (für Proxmox-VM, Kontext)

Falls die Debian-Box eine **VM in Proxmox** ist (auch wenn wir
Proxmox nicht aktiv nutzen – nur als Kontext, falls jemand noch
Proxmox-Boards hat):

```bash
# Auf dem Proxmox-Host: /etc/network/interfaces
auto vmbr0
iface vmbr0 inet static
    address 192.168.1.20/24
    gateway 192.168.1.1
    bridge_ports eno1
    bridge_stp off
    bridge_fd 0
```

Die VM bekommt dann ihre IP über die `vmbr0`-Bridge und ist im
LAN sichtbar.

## mDNS für Service-Discovery (optional, Komfort)

Eigenen Hostnamen im LAN auflösbar machen:

```bash
sudo apt install -y avahi-daemon
sudo systemctl enable --now avahi-daemon

# Test (vom Laptop)
ssh root@pe-vm-01.local
# Funktioniert, wenn der Laptop auch mDNS hat (macOS ja,
# Windows mit Bonjour, Linux mit avahi)
```

So können Sensoren den Broker über `mosquitto.local` finden statt
über `192.168.1.50`.

## Wichtige Netzwerk-Werkzeuge

```bash
# Welche Ports sind offen?
sudo ss -tlnp
sudo ss -tlnp | grep LISTEN

# Wer ist im LAN?
arp -a
# oder besser:
sudo nmap -sn 192.168.1.0/24
# (nmap muss installiert sein: apt install nmap)

# Welcher Prozess nutzt Port X?
sudo lsof -i :8080
sudo lsof -i :1883

# Routing-Tabelle
ip route
ip route get 1.1.1.1

# DNS-Lookup
nslookup github.com
dig github.com
```

## Häufige Probleme

??? failure "Plötzlich keine Verbindung mehr"
    NetworkManager hat die Config überschrieben. Siehe oben.
    Oder: DHCP-Lease abgelaufen, IP gewechselt.

??? failure "Kann Broker-IP vom ESP32 nicht pingen"
    Firewall-Regel? `sudo iptables -L` sollte leer sein.
    Bridge-Konfiguration auf dem VM-Host?

??? failure "Vom Laptop aus erreichbar, von Sensoren aus nicht"
    AP isoliert Client-Verbindungen? Im Router prüfen.
    Manchmal hilft: AP auf 2.4 GHz only zwingen.

## Siehe auch

- [pe-raumklima-bootcamp/docs/tag-2/theorie-netzwerk.md](../../../pe-raumklima-bootcamp/docs/tag-2/theorie-netzwerk.md) – Netzwerk-Theorie
- [pe-raumklima-bootcamp/docs/tag-2/hands-on-netzwerk.md](../../../pe-raumklima-bootcamp/docs/tag-2/hands-on-netzwerk.md) – Hands-on
- [mosquitto-config.md](mosquitto-config.md) – Broker-Config
- [NOTIZEN.md](NOTIZEN.md) – Design-Entscheidungen