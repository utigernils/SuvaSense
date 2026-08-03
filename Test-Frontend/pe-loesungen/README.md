# PE-Trainer-Lösungen (lokal, NICHT im Git)

!!! danger "Nur für Trainer-Zugriff"
    Dieser Ordner enthält die Referenz-Implementierungen für die
    **PE-Projektaufgaben** (Plattformentwickler-Bootcamp, 06.–12.08.2026).
    Er liegt **lokal** unter `Test-Frontend/pe-loesungen/` und ist
    **nicht** Teil des `pe-raumklima-bootcamp`-Repos auf GitHub.
    **Lernende haben keinen Zugriff darauf.**

    Verwende die Dateien hier für:
    - **1:1-Coaching:** Live mit dem Lernenden am Code durchgehen
    - **Code-Review:** Zeigen, was eine saubere Lösung ausmacht
    - **Eigenes Coaching vorbereiten:** Die `NOTIZEN.md` pro Tag
      erklären Design-Entscheidungen und Alternativen
    - **Eigene Aufgaben ableiten:** Die Referenz als Vorlage für
      ähnliche Übungen verwenden

## Konzept

In den Projekt-Aufgaben der Tag-1-bis-Tag-4-Dokumentation bekommen
Lernende **Anforderungen + Skelett + Hinweise**, aber keinen
fertigen Code. Sie sollen selbst knobeln, fragen, und mit
Trainer-Hilfe Probleme lösen.

Die Referenz hier ist **deine** Vorbereitung – nicht die
Lernenden-Abkürzung. Wenn ein Lernender fragt "Wie geht das?":

1. Frag zurück: "Was hast du schon versucht? Was zeigt die
   Konsole?"
2. Öffne parallel den passenden Tag-Ordner
3. Geh den relevanten Abschnitt live durch
4. Erkläre das _Warum_ (siehe `NOTIZEN.md` pro Tag)
5. Lass den Lernenden selbst zurückschreiben – nicht kopieren

## Struktur

```
pe-loesungen/
├── README.md                       ← diese Datei
├── tag-1/                          ← Tag 1 (06.08.)
│   ├── esp32-config.md             ← Seriennummer setzen, Broker-Adresse
│   ├── debian-setup.md             ← Debian-Box-Konfiguration
│   ├── config-fenster-befehle.md   ← Die 5-Sek-Fenster-Befehle
│   └── NOTIZEN.md
├── tag-2/                          ← Tag 2 (07.08.)
│   ├── mosquitto-config.md         ← mosquitto.conf mit Persistenz
│   ├── netzwerk-static-ip.md       ← /etc/network/interfaces
│   ├── docker-quick-ref.md        ← Container-Befehle
│   └── NOTIZEN.md
├── tag-3/                          ← Tag 3 (10.08.)
│   ├── docker-compose-prod.yml     ← Mit Kommentaren
│   ├── schema.sql                  ← sensor + readings Tabellen
│   ├── backend-config.md           ← Umgebungsvariablen
│   └── NOTIZEN.md
└── tag-4/                          ← Tag 4 (11.08.)
    ├── stresstest-commands.md      ← Befehle für 1-h-Laufzeit
    ├── demo-skript.md              ← 5-7 Min Demo-Skript
    ├── backup-pflicht-skript.md    ← pg_dump + snapshot
    └── NOTIZEN.md
```

## Häufige Smart-Learner-Fragen

| Frage | Antwort |
|---|---|
| "Gibt es irgendwo Lösungen?" | "Nein, ich zeig sie dir, wenn du 20 Min probiert hast." |
| "Kann ich kurz spicken?" | "Frag lieber – ich helfe beim Verstehen." |
| "Wer hat das gebaut?" | "Ein Trainer-Team, das die Aufgaben ausgearbeitet hat. Du baust jetzt deine Version." |
| "Ist meine Lösung schlecht?" | "Sie ist anders. Lass uns vergleichen, was gut und was anders ist." |

## Wichtig

- Dieser Ordner ist **kein** offizielles Lehrmaterial – er ist
  Trainer-Werkzeug.
- Die Lösungen hier sind **eine** mögliche Variante, nicht "die
  richtige". Lernende werden andere Farben, andere Variablen-
  namen, andere Strategien wählen – das ist erwünscht.
- Die `NOTIZEN.md` pro Tag sind auch nach dem Bootcamp nützlich
  als Nachschlagewerk für Design-Entscheidungen.
- Bei jeder Aktualisierung des Lern-Repos: synchronisieren, ob
  sich Anforderungen geändert haben (Schwellwerte, Topic-Format,
  etc.).

## Parallel zu AE-Lösungen

Im selben `Test-Frontend/`-Verzeichnis gibt es auch
`loesungen/` (für das AE-Bootcamp). Das ist ein **anderes**
Lösungs-Set (Web-App, nicht Plattform). Verwende das richtige
Verzeichnis für die jeweilige Lern-Gruppe:

- **AE-Lernende** (Applikationsentwickler) → `loesungen/`
- **PE-Lernende** (Plattformentwickler) → `pe-loesungen/`

Trainer, die beide Gruppen betreuen, haben beide Ordner lokal
und können je nach Bedarf darauf zugreifen.