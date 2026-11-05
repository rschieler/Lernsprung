# Lernsprung – Hinweise für Claude

Lern-App für die Tochter von Ronny (4. Klasse, Primarschule, Kanton St. Gallen).
Live: https://rschieler.github.io/Lernsprung/ (GitHub Pages, Branch `main`, Root).

## Grundsätze
- Inhalte immer nach **Lehrplan 21 (Lehrplan Volksschule St. Gallen)**. Bringt Ronny Lernziel-Blätter oder Arbeitsblätter als Scan, werden Übungen und Probetests darauf abgestimmt.
- Englisch folgt **Young World 2** (Klett und Balmer). Mathe, Deutsch und NMG folgen dem Lehrplan 21, nicht einem Lehrmittel.
- **Keine Inhalte aus Lehrmitteln abschreiben** (Klett untersagt die Nutzung in KI-Systemen). Nur Struktur und Themen übernehmen, Aufgaben selbst formulieren.
- Schweizer Schreibweise: «ss» statt «ß», Velo, Guetzli, Spital usw. Anführungszeichen « ».
- Ronny will knappe, präzise Antworten und fertige Lösungen statt Optionen. Er kommuniziert auf Deutsch.

## Aufbau
Alles steckt in **einer Datei: `index.html`** (HTML, CSS, JS, keine Build-Schritte).

- `CATALOG` (oben im Script): Fach › Schuljahr (`grade`) › Lehrmittel (`books`) › Units.
  - **IDs von Fächern, Büchern und Units nie ändern.** Daraus werden die Schlüssel für Lernstand und Noten gebildet (`fach-klasse-buch-unit`).
  - Neue Units hinten oder an passender Stelle einfügen. `no` (z.B. «Thema 3») ist nur die Anzeige.
- Unit-Typen (kombinierbar):
  - **Wort-Units** (Englisch): `words: [[en, de, emoji, 1 = nicht in Hörübung, Kategorie]]`, `sentences: [[Satz mit ___, Lösung, [Auswahl], Deutsch, Emoji]]`, optional `tests` (eigene Übungstests mit Pflichtwörtern).
  - **Generator-Units**: `gen: 'name'` → Funktion in `GEN`. Rückgabe `{ prompt, q, answer, options?|choices?, fixed?, alts?, uml?, unit?, html?, sol }`. Zahlen-Antworten = Eingabe, `options` = immer Auswahl, `choices` = Ablenker für den Auswahl-Modus. `choiceOnly: true` = nur Auswahl.
  - **Quiz-Units**: `quiz: [[Frage, richtig, falsch1, falsch2, falsch3]]`, `write: [[Frage, 'Antwort|Alternative']]`.
  - `learn: { tips, examples, table?, conj? }` für die Lernseite, `lp` für den Lehrplan-Code, `labels` für eigene Übungsnamen.
- Spielminuten: `earn()`, `playState()`, Spiel `showGame()`, Eltern-Bereich `showParents()` (PIN, Tagesmaximum Standard 30 Min, änderbar).

## Synchronisation
- Auf GitHub Pages: **Firebase Firestore**, Dokument `families/{Familien-Code}` (Projekt `lernsprung-ea1d2`, Anonym-Login). Der Code steckt im Link `?f=…` und im localStorage.
- Als claude.ai-Artefakt: Artifact-Capability `db`, Dokument `lernstand/familie`.
- Gespeicherte Felder: `known`, `tests`, `stars`, `play`, `settings`, `best`, `reset` (Zeitstempel des letzten Zurücksetzens; Geräte mit älterem Stand verwerfen ihren Lernstand beim Zusammenführen). Neue Felder in `mergeDB`, `snapshotOf`, `remoteOf` und `pushCloud` ergänzen.

## Vor jedem Push testen
```
cd tests && npm install --silent && node generators.js && node walk.js
```
- `generators.js` ruft jeden Generator 3000-mal auf und prüft Antworten und Auswahlmöglichkeiten.
- `walk.js` klickt in jedem Fach jede Unit, jede Übung und jeden Probetest durch, dazu Spiel und Eltern-Bereich.
- Beide müssen ohne Fehler durchlaufen. Bei Layout-Änderungen zusätzlich Screenshots in Handy-Grösse (390 px) mit Playwright prüfen.

## Veröffentlichen
Vor jedem Push `APP_VERSION` (unten im Script) hochzählen, z.B. `2026-11-05-2`. Die App vergleicht sie mit der Online-Version und zeigt «Neue Version da – tippen zum Laden».
Commit auf `main` und pushen. GitHub Pages ist nach etwa einer Minute aktualisiert. Danach die App auf dem Handy schliessen und neu öffnen.
