# Lernsprung – Hinweise für Claude

Lern-App für die Tochter von Ronny (Schuljahr 2026/27 in der 4. Klasse, ab August 2027 5. Klasse, Primarschule, Kanton St. Gallen). Inhalte für die 4. und 5. Klasse.
Live: https://rschieler.github.io/Lernsprung/ (GitHub Pages, Branch `main`, Root).

## Grundsätze
- Inhalte immer nach **Lehrplan 21 (Lehrplan Volksschule St. Gallen)**. Bringt Ronny Lernziel-Blätter oder Arbeitsblätter als Scan, werden Übungen und Probetests darauf abgestimmt.
- Englisch folgt **Young World 2** (4. Klasse) und **Young World 3** (5. Klasse, Ausgabe 2020) von Klett und Balmer. Französisch (ab 5. Klasse) folgt den Themen von **dis donc! 5** (LMVZ). Mathe, Deutsch und NMG folgen dem Lehrplan 21, nicht einem Lehrmittel.
- Französisch: Der Kantonsrat hat im September 2025 beschlossen, Französisch in die Oberstufe zu verschieben; Umsetzung offen (Stand Nov. 2026, Vorarbeiten bis Q1 2027). Bei Änderung das Fach `fr` entfernen oder ausblenden.
- Zyklus 2: Plusquamperfekt und die vier Fälle nur entdecken, nicht abfragen; indirekte Rede erst Zyklus 3.
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
  - `sort: { bins:[…], items:[[Text, Kiste]] }` für das Lernspiel Sortieren (sonst aus Wort-Kategorien oder Generatoren mit `fixed`-Optionen). `grammar: { title, tips, examples, quiz, write }` für Grammatik in Wort-Units.
  - `learn: { tips, examples, table?, conj? }` für die Lernseite, `lp` für den Lehrplan-Code, `labels` für eigene Übungsnamen.
- Lernspiele unter «Üben»: Blitz-Sprung (`showBlitz`), Memory (`showMemory`), Sortieren (`showSort`), Uhr stellen (`showClock`, Unit-Flag `clockGame:true`), Kantonskarte (`showMap`, Unit-Flag `mapGame:'sg1'|'sg2'|'ch'`, Kartendaten `SGMAP.sg1` (weiter Ausschnitt mit Nachbarkantonen) und `SGMAP.sg2` (Wahlkreise) aus swiss-maps 2024 / BFS). Rekorde in `DB.games`. Memory und Kantonskarte geben keine Spielminuten.
- Schreiben: Deutsch prüft Gross-/Kleinschreibung (`inputCheck`, `t.cs`). Dezimalzahlen: `dec:true` (Punkt oder Komma). Französisch: Artikel optional, fehlende Akzente gelten mit Hinweis als richtig. Englisch-Wörter auch Englisch → Deutsch (`B.writeDe`). Nach einem Schreibfehler muss beim Üben richtig abgeschrieben werden.
- Eigene Lernlisten (Eltern-Bereich): `DB.custom` pro Familie, Arten `vok` (Fremdwort = Deutsch), `diktat` (Lernwörter, Vorlesen + Richtig geschrieben?) und `qa` (Frage = Antwort). `applyCustom()` hängt sie als Buch `eigene` (Unit-ID `c_<id>`) ins `CATALOG`. Editor `showListEditor`, Parser `parseList`. Kinder erstellen Listen ohne PIN über «+ Lernliste erstellen» in der Fachübersicht (`startKidList`, `LISTCTX.kid`, abschaltbar mit `settings.kidLists`); solche Listen haben `by:'kind'` und geben erst nach Freigabe durch die Eltern (`ok:true`, «Speichern und freigeben») Spielminuten (`listApproved`, Prüfung in `earn`). Ändert das Kind die Liste, ist die Freigabe wieder weg.
- Mit KI erstellen (`showAiImport`): jede Familie nutzt ihre eigene KI-App, die Lern-App ruft selbst **keine** KI auf (Gemini-API-Bedingungen verbieten Apps, die von unter 18-Jährigen genutzt werden; auch keinen eigenen Schlüssel einbauen). Ablauf: Auftrag kopieren/teilen (`aiPromptCopy`) → in ChatGPT/Claude/Gemini mit Foto → Antwort einfügen, `parseAiAnswer` liest JSON (auch mit ```-Block, typografischen Anführungszeichen) oder Zeilen «a = b». Im Kinder-Modus ist Eintippen der Hauptweg, die KI-Variante nur aufklappbar mit Hinweis auf die Eltern. Ergebnis öffnet den Editor als Entwurf (`showListEditor(null, draft)`), falsche Antworten als `items[i][2..]`, Lernziele in `goals`.
- Spielminuten nur nach Note (`noteOf`, Tabellen `MIN_PRACTICE` und `MIN_TEST`, `earnNote`). Lernkarten geben keine Minuten, «Fehler üben» 1 Min wenn alles korrigiert, unter 2 s Denkzeit pro Aufgabe (`tooFast`) 0 Min, Verbesserung im Probetest +2 Min. Jede Übung zählt höchstens zweimal pro Tag.
- Spielminuten-Technik: `earn()`, `playState()`, Spiel `showGame()`, Tagesmaximum pro Profil (Standard 30 Min).

## Profile
- Mehrere Profile pro Familie (Geschwister, Testprofil `test:true` für Eltern). Pro Profil: `known`, `tests`, `stars`, `play`, `best`, `games`, `reset` (Liste `PF`, dazu `log`, `err`, `pt`, `red`). Gemeinsam: `settings`, `custom`, `profiles`.
- Gespeichert wird **kanonisch** (`toCanon`): oben der Lernstand von Profil `p1` (kompatibel mit älteren App-Versionen), weitere Profile in `pd`. Im Speicher steht oben das aktive Profil (`fromCanon`, `ACTIVE`, pro Gerät in localStorage `lernsprung-profil`). `mergeDB` = `mergeCore` für p1 plus pro Profil in `pd`. Fehlt `pd` in der Cloud (altes Gerät), lädt ein neues Gerät es wieder hoch.
- Pro Profil in `DB.profiles[id]` (familienweit synchronisiert): `name`, `icon`, `grade`, `max` (Tagesmaximum, `profMax`), `pin` (Profil-PIN, beim Wechseln abgefragt, Eltern-PIN gilt immer), `kidLists` (darf Lernlisten erstellen, `kidListsOn`). Zugriff auf Daten eines anderen Profils mit `profPD(id)`, Spielzeit `playOf`, `restOf`.
- Oberfläche: Hamburger-Menü ☰ (`openMenu`: Start, Fach, Profil wechseln, Spiel, Lernliste erstellen, Eltern-Bereich), Profil-Knopf in der Kopfzeile (`profBtn`), «Wer lernt?» (`showProfiles`).
- Eltern-Bereich (`showParents` → `parentPanel` mit `PTAB`): «Kinder» (Übersicht aller Profile), `prof:<id>` (`profileSettings`: Name, Bild, Klasse, Tagesmaximum, Bonus, Profil-PIN, Lernlisten-Recht, Probetests, Zurücksetzen, Löschen), «Familie» (`familyPage`: Geräte verbinden, Lernlisten, Eltern-PIN), «Dieses Gerät» (`devicePage`: Eltern-Gerät `DEV.parent` öffnet direkt den Eltern-Bereich, `DEV.remember` merkt den PIN, Profil für dieses Gerät; localStorage `lernsprung-geraet`). `PARENT_OK` = Eltern-Bereich entsperrt, wird beim Start-Bildschirm zurückgesetzt. Biometrie (Fingerabdruck/Gesicht) über WebAuthn als Ergänzung zum PIN, pro Gerät (`DEV.bio` = Credential-ID, `bioRegister`, `bioVerify` prüft das UV-Flag), nur in sicherem Kontext (https/localhost).

## Elternprofil, Auswertung, Belohnungen
- Elternprofile `DB.parents[id]` (familienweit): `name`, `icon`, `pin` (pro Elternteil eindeutig), `admin`, `tmp` (Start-PIN, beim ersten Öffnen eigenen PIN setzen). `liveParents()` migriert den alten `settings.pin` zu `e1` (Admin). `settings.pin` = PIN des ersten Admins (`syncAdminPin`, für ältere Versionen). Angemeldet: `PARENT_WHO`, `curParent()`, `isAdmin()`. Nur Admins sehen den Tab «Eltern» (`parentsPage`), mindestens ein Admin bleibt. Jeder Eltern-PIN öffnet Profile mit Profil-PIN (`anyParentPin`). Fingerabdruck pro Gerät für ein Elternteil (`DEV.who`).
- Tabs im Elternprofil: `home` (Kinder), `dash:<id>` (`dashboard`), `rew` (`rewardsPage`), `family`, `parents`, `device`, `prof:<id>`.
- Erfassung pro Profil (`track`, in `answer()` und Blitz-Sprung): `log[Tag] = {s Sekunden, n, ok, dp, u:{unitKey:[n,ok]}}` (120 Tage), `err` = letzte 60 Fehler `{d,k,q,a,c}`. Dashboard: Woche vs. Vorwoche, 14 Tage, Fächer, Notenverlauf, Stärken/Schwächen (ab 10 Aufgaben), häufige Fehler → Lernliste (`qa`), Wochenbericht teilen. Kein Geschwister-Ranking.
- Lernpunkte 🏅 `pt[Tag]`: Übung Note ≥ 5,5 = 1, Probetest 5,5 = 2, 6 = 3 (in `earnNote`, gleiche Wiederholungs-Sperre), 10 Min Lernen am Tag = 1. Belohnungen `DB.rewards` (familienweit, von Eltern, Vorschläge `REWARD_IDEAS`), Wünsche pro Profil `red = [{id,rid,name,icon,cost,d,st:'offen'|'ok'|'nein',t}]`. Kontostand `pointsOf(d)` = Punkte − Kosten nicht abgelehnter Wünsche. Kinder-Seite `showRewards` (Menü «Belohnungen»).
- Wochenziel pro Profil `DB.profiles[id].goal = {min, days}` (in `profileSettings`), Anzeige `goalHTML` auf Startseite und Dashboard, Bonus einmal pro Woche +5 Punkte als `pt['W'+Montag]` (`checkGoal` in `track`).
- Prüfungsplaner `DB.exams[id] = {p, d, s, g, units:[unitKey], title, note, by}` (familienweit). Eintragen über Menü «Prüfung eintragen» (Kind) oder Dashboard (Eltern), `showExamForm`. Startseite zeigt Prüfungen der nächsten 21 Tage mit Bereitschaft pro Thema (`readiness`: Bestnote Probetest, sonst Trefferquote) und Tagestipp (`examPlan`), «Jetzt üben» öffnet das schwächste Thema (`openUnit`). Eltern tragen nach der Prüfung die echte Note ein. Notenfarben (`noteColor`): 5,5–6 dunkelgrün, 5–5,4 hellgrün, 4–4,9 gelb, unter 4 rot, ohne Probetest grau.

## Synchronisation
- Auf GitHub Pages: **Firebase Firestore**, Dokument `families/{Familien-Code}` (Projekt `lernsprung-ea1d2`, Anonym-Login). Der Code steckt im Link `?f=…` und im localStorage.
- Als claude.ai-Artefakt: Artifact-Capability `db`, Dokument `lernstand/familie`.
- Gespeicherte Felder: `profiles`, `pd`, `parents`, `rewards`, `log`, `err`, `pt`, `red`, `known`, `tests`, `stars`, `play`, `settings`, `best`, `games`, `custom` (eigene Lernlisten, pro Liste gewinnt die neuere `t`, gelöscht = `del:true`; in Firestore als Objekte `{a,b,w}` über `customToCloud`/`customFromCloud`, weil Firestore keine Listen in Listen erlaubt), `reset` (Zeitstempel des letzten Zurücksetzens; Geräte mit älterem Stand verwerfen ihren Lernstand beim Zusammenführen). Neue Felder in `mergeDB`, `snapshotOf`, `remoteOf` und `pushCloud` ergänzen.

## Vor jedem Push testen
```
cd tests && npm install --silent && node generators.js && node walk.js
```
- Zusätzlich bei Änderungen am Entsperren: `node bio.js` (Playwright, virtueller Fingerabdruck-Sensor über CDP).
- `generators.js` ruft jeden Generator 3000-mal auf und prüft Antworten und Auswahlmöglichkeiten.
- `walk.js` klickt in jedem Fach jede Unit, jede Übung und jeden Probetest durch, dazu Spiel und Eltern-Bereich.
- Beide müssen ohne Fehler durchlaufen. Bei Layout-Änderungen zusätzlich Screenshots in Handy-Grösse (390 px) mit Playwright prüfen.

## Veröffentlichen
Vor jedem Push `APP_VERSION` (unten im Script) hochzählen, z.B. `2026-11-05-2`. Die App vergleicht sie mit der Online-Version und zeigt «Neue Version da – tippen zum Laden».
Commit auf `main` und pushen. GitHub Pages ist nach etwa einer Minute aktualisiert. Danach die App auf dem Handy schliessen und neu öffnen.
