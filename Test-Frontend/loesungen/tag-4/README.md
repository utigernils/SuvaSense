# Tag 4 – Stresstest, Demo, Backup

Tag 4 ist der **Höhepunkt der Woche**: 1-Std-Laufzeit mit
mehreren Sensoren, Probe-Demo, gemeinsame Demo-Show um 16:30.
Hier sind die Trainer-Referenzen für die **Befehle, Skripte
und Vorlagen**, die du am Tag 4 brauchst.

**Was am Tag 4 NICHT programmiert wird:** es gibt keinen
Frontend-Code, keine neuen Sensoren, keine Konfig-Files. Tag 4
ist **Test + Demo + Vorstellung** – die Lösung ist, die
**existierende Plattform zu beweisen** und **vorzuführen**.

## Struktur

```
tag-4/
├── stresstest-commands.md      # Alle Stresstest-Befehle
├── demo-skript.md              # 5-7 Min Demo-Skript
├── backup-pflicht-skript.md    # pg_dump + Snapshot
├── NOTIZEN.md                  # Design-Entscheidungen
└── README.md                   # Übersicht (was wann zu tun ist)
```

## Reihenfolge am Tag 4

| Zeit | Aufgabe | Datei |
|---|---|---|
| 08:00–08:15 | Daily | – |
| 08:15–10:00 | Stresstest (mehrere Sensoren parallel) | `stresstest-commands.md` |
| 10:00–12:00 | Stresstest fortsetzen (1 h Laufzeit) | `stresstest-commands.md` |
| 12:00–13:00 | Mittag | – |
| 13:00–14:30 | Stresstest / Puffer / Debuggen | `stresstest-commands.md` |
| 14:30–15:00 | Demo-Vorbereitung (Skript, Probe-Demo) | `demo-skript.md` |
| 15:15–16:00 | Tagesabschluss | – |
| 16:30–17:30 | **Gemeinsame Demo-Show** | `demo-skript.md` |

## Backup vor Tag 4

Vor dem Stresstest **unbedingt** ein Backup machen (siehe
`backup-pflicht-skript.md`):

1. **`pg_dump`** der Postgres-DB (falls schon welche Daten drin
   sind)
2. **Snapshot** der Debian-Box (mit Timeshift)
3. **Backup-Video** der Demo aufnehmen (30–60 s, für den
   Notfall)

Falls der Stresstest etwas kaputt macht, kannst du in 10 Sekunden
zum frischen Stand zurückkehren.

## Was NICHT zu Tag 4 gehört

- Keine Code-Änderungen am Backend
- Keine neuen Sensoren
- Keine Konfig-Änderungen am Docker-Stack
- Keine Übung für Lernende zum Flashen oder Konfigurieren

Tag 4 ist **Showtime** – die Plattform ist bereits gebaut, jetzt
wird sie **getestet und vorgeführt**.

## Wann diese Lösungen nutzen

- **Du (Trainer) führst die Stresstest-Befehle aus** und
  dokumentierst die Ergebnisse
- **Du (Trainer) bereitest das Demo-Skript vor** und probst es
  einmal
- **Du (Trainer) machst das Backup-Video** der Demo
- **Lernende schauen zu** und lernen, was Stabilität in der Praxis
  bedeutet