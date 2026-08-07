# Trainer-Lösungen (lokal, NICHT im Git)

!!! danger "Nur für Trainer-Zugriff"
    Dieser Ordner enthält die Referenz-Implementierungen für die
    Tag-1-, Tag-2- und Tag-3-Projektaufgaben. Er liegt **lokal**
    unter `Test-Frontend/loesungen/` und ist **nicht** Teil des
    `ae-raumklima-bootcamp`-Repos auf GitHub. Lernende haben
    keinen Zugriff darauf.

    Verwende die Dateien hier für:
    - **1:1-Coaching:** Live mit dem Lernenden am Code durchgehen
    - **Code-Review:** Zeigen, was eine saubere Lösung ausmacht
    - **Eigenes Coaching vorbereiten:** Die `NOTIZEN.md` pro Tag
      erklären Design-Entscheidungen und Alternativen
    - **Eigene Aufgaben ableiten:** Die Referenz als Vorlage für
      ähnliche Übungen verwenden

## Konzept

In den Projekt-Aufgaben der Tag-1-bis-Tag-3-Dokumentation bekommen
Lernende **Anforderungen + Skelett + Hinweise**, aber keinen
fertigen Code. Sie sollen selbst knobeln, fragen, und mit
Trainer-Hilfe Probleme lösen.

Die Referenz hier ist **deine** Vorbereitung – nicht die
Lernenden-Abkürzung. Wenn ein Lernender fragt "Wie geht das?":

1. Frag zurück: "Was hast du schon versucht? Was zeigt die
   Konsole?"
2. Öffne parallel den passenden Tag-Ordner
3. Geh den relevanten Abschnitt live durch
4. Erkläre das _Warum_ (siehe `NOTIZEN.md`)
5. Lass den Lernenden selbst zurückschreiben – nicht kopieren

## Struktur

```
loesungen/
├── tag-1/                  # Dashboard Grundlayout
│   ├── index.html          # komplette HTML-Referenz
│   ├── style.css           # komplettes CSS mit Status-Farben
│   ├── script.js           # leer (Tag 1: nur Layout, keine Logik)
│   └── NOTIZEN.md          # Design-Entscheidungen + Alternativen
├── tag-2/                  # Statuslogik + Daten laden
│   ├── data.json           # 10 Push-Bundles
│   ├── index.html
│   ├── style.css
│   ├── script.js           # Statuslogik + fetch + Verlauf
│   └── NOTIZEN.md
├── tag-3/                  # Snapshot-Fallback-Strategie
│   ├── data.json
│   ├── index.html          # mit Admin-Panel (sensor-select)
│   ├── style.css
│   ├── script.js           # API → localStorage → Seed (3 Stufen)
│   └── NOTIZEN.md
└── tag-4/                  # Stresstest, Demo, Backup (kein Code)
    ├── README.md           # Übersicht + Reihenfolge
    ├── stresstest-commands.md   # alle Stresstest-Befehle
    ├── demo-skript.md       # 5-7 Min Demo-Skript
    ├── backup-pflicht-skript.md # pg_dump + Snapshot
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
  richtige". Lernende werden andere Farben, Abstände,
  Variablennamen wählen – das ist erwünscht.
- Die `NOTIZEN.md` pro Tag sind auch nach dem Bootcamp nützlich
  als Nachschlagewerk für Design-Entscheidungen.
- Bei jeder Aktualisierung des Lern-Repos: synchronisieren, ob
  sich Anforderungen geändert haben (Schwellwerte, IDs, etc.).