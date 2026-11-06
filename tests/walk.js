// Klickt alle Fächer, Units, Übungen, Probetests, Spiel und Eltern-Bereich durch: node walk.js
const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const w = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w) {
  w.scrollTo = () => {};
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, k) => k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
} }).window;
const d = w.document, errs = []; w.addEventListener('error', e => errs.push(e.message));
const submit = () => { const f = d.querySelector('#inf'); d.querySelector('#inp').value = '1'; f.dispatchEvent(new w.Event('submit', { cancelable: true })); };
const step = () => { const o = d.querySelector('.opt:not([disabled])'), f = d.querySelector('#inf');
  if (o) o.click(); else if (f && !d.querySelector('#inp').disabled) submit(); else if (d.querySelector('.ltile:not(.used)')) d.querySelectorAll('.ltile').forEach(b => b.click()); };
setTimeout(() => { try {
  // Eigene Lernlisten über den Editor im Eltern-Bereich anlegen
  w.eval("DB.settings.pin = ''; PARENT_OK = true; PTAB = 'family'; parentPanel()");
  const mk = (sg, kind, title, text) => { d.querySelector('#plnew').click(); d.querySelector('#lsg').value = sg; d.querySelector('#lsg').onchange();
    d.querySelector('#lkind').value = kind; d.querySelector('#lkind').onchange(); d.querySelector('#ltitle').value = title; d.querySelector('#ltext').value = text; d.querySelector('#ltext').oninput(); d.querySelector('#lsave').click(); };
  mk('en|4', 'vok', 'Test Vokabeln', 'the bakery = die Bäckerei\nthe library = die Bibliothek\nturn left = links abbiegen\nthe bridge = die Brücke\nthe station = der Bahnhof\nthe castle = das Schloss');
  mk('de|4', 'diktat', 'Test Lernwörter', 'Strasse\nfahren\nder Fuss\nvielleicht\nTier, Kiste\nWasser');
  mk('nmg|5', 'qa', 'Test Fragen', 'Hauptort SG = St.Gallen\nLängster Fluss = Aare\nHöchster Berg = Dufourspitze\nBundesstadt = Bern\nAnzahl Kantone = 26');
  const nl = w.eval("Object.values(DB.custom).filter(x => !x.del).length"), cu = w.eval("CATALOG.flatMap(s => s.grades.flatMap(g => g.books.filter(b => b.id === 'eigene').flatMap(b => b.units))).length");
  if (nl !== 3 || cu !== 3) throw new Error(`Eigene Lernlisten: ${nl} gespeichert, ${cu} Units`);
  const pv = w.eval("JSON.stringify(parseList('vok', '1. the dog = der Hund\\nkaputt\\ncat; Katze'))");
  if (pv !== JSON.stringify({ items:[['the dog','der Hund'],['cat','Katze']], bad:['kaputt'] })) throw new Error('parseList falsch: ' + pv);
  // Foto-Import: Entwurf von Gemini (simuliert) übernehmen
  w.eval(`showListEditor(null, { s:'nmg', g:4, kind:'qa', title:'Foto-Test', ai:true, goals:['Ich kenne die Nachbarkantone.'], items:[
    ['Nachbarkanton im Norden','Thurgau','Zürich','Glarus','Uri'],['Hauptort','St.Gallen','Chur','Wil','Gossau'],['Fluss im Osten','Rhein','Aare','Thur','Linth'],['4.5 km = ? m',"4'500 m",'450 m','45 m',"45'000 m"]] })`);
  d.querySelector('#lsave').click();
  const fl = w.eval("JSON.stringify(Object.values(DB.custom).find(x => x.title === 'Foto-Test'))");
  if (!fl || !fl.includes('"Glarus"') || !fl.includes('Nachbarkantone')) throw new Error('Foto-Entwurf nicht korrekt gespeichert: ' + fl);
  const qa = w.eval(`JSON.stringify([inputCheck({ alts:qaAlts("4'500 m").split('|') }, '4500').ok, inputCheck({ alts:qaAlts("4'500 m").split('|') }, '4500 m').ok, inputCheck({ alts:qaAlts("4'500 m").split('|') }, '450').ok])`);
  if (qa !== '[true,true,false]') throw new Error('Einheiten-Alternativen falsch: ' + qa);
  console.log('OK: Eigene Lernlisten angelegt (inkl. Foto-Entwurf)');
  // KI-Antworten einlesen (ChatGPT/Claude/Gemini schreiben unterschiedlich)
  const F = '`'.repeat(3), cases = [
    ['Hier ist deine Liste:\n' + F + 'json\n{"lernsprung":1,"title":"Unit 3","kind":"vok","goals":["Ich kann Orte nennen."],"items":[{"a":"bakery","b":"die Bäckerei","wrong":[]},{"a":"library","b":"die Bibliothek"}]}\n' + F + '\nViel Erfolg!', 'en'],
    ['{“title”:“Längen”,“kind”:“qa”,“items”:[{“a”:“1 m = ? cm”,“b”:“100 cm”,“wrong”:[“10 cm”,“1000 cm”,“100 cm”]},{“a”:“1 km = ? m”,“b”:“1000 m”}]}', 'ma'],
    ['the dog = der Hund\nthe cat = die Katze', 'en'], ['Leider kann ich das Bild nicht lesen.', 'nmg']];
  const pa = w.eval(`JSON.stringify(${JSON.stringify(cases)}.map(([t, s]) => parseAiAnswer(t, s)))`);
  const P = JSON.parse(pa);
  if (P[0].kind !== 'vok' || P[0].items.length !== 2 || P[0].goals[0] !== 'Ich kann Orte nennen.' || P[1].kind !== 'qa' || P[1].items[0].length !== 4 || P[2].items.length !== 2 || P[3] !== null)
    throw new Error('KI-Antwort falsch eingelesen: ' + pa);
  // Antwort einfügen öffnet den Entwurf; die App selbst ruft keine KI auf
  w.eval("PTAB = 'family'; parentPanel()"); d.querySelector('#plcam').click(); if (!d.querySelector('#acopy') || d.querySelector('#pcam')) throw new Error('KI-Seite falsch');
  d.querySelector('#apaste').value = F + 'json\n{"kind":"qa","title":"Einfügen","items":[{"a":"X?","b":"1"},{"a":"Y?","b":"2"}]}\n' + F; d.querySelector('#atake').click();
  if (!d.querySelector('#lsave') || !d.querySelector('#ltext').value.includes('X? = 1')) throw new Error('Einfügen öffnet keinen Entwurf');
  console.log('OK: Mit KI erstellen (Auftrag kopieren, Antwort einfügen)');
  // Firestore: keine Listen in Listen, Hin- und Rückweg verlustfrei
  const nest = w.eval(`(() => { const bad = []; const walk = (v, p, inArr) => { if (Array.isArray(v)) { if (inArr) bad.push(p); v.forEach((x, i) => walk(x, p + '[' + i + ']', true)); }
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, p + '.' + k, false)); }; walk(cloudPayload(), 'doc', false); return bad.slice(0, 3).join(', '); })()`);
  if (nest) throw new Error('Firestore lehnt Listen in Listen ab: ' + nest);
  const rt = w.eval("JSON.stringify(customFromCloud(JSON.parse(JSON.stringify(customToCloud(DB.custom))))) === JSON.stringify(DB.custom)");
  if (!rt) throw new Error('Eigene Lernlisten gehen beim Synchronisieren verloren');
  console.log('OK: Cloud-Format (Firestore)');
  // Kind erstellt eine Liste ohne PIN: erst nach Freigabe Spielminuten
  w.eval("NAV.s = CATALOG.find(x => x.id === 'en'); NAV.g = NAV.s.grades.find(x => x.grade === 4); NAV.n = 4; setColor(); showUnits()");
  if (!d.querySelector('#kidnew')) throw new Error('Kein Knopf «Lernliste erstellen» für Kinder');
  d.querySelector('#kidnew').click(); d.querySelector('#pman').click();
  d.querySelector('#ltitle').value = 'Kinder-Liste'; d.querySelector('#ltext').value = 'red = rot\nblue = blau\ngreen = grün\nyellow = gelb'; d.querySelector('#ltext').oninput(); d.querySelector('#lsave').click();
  const kid = w.eval("JSON.stringify(Object.values(DB.custom).find(x => x.title === 'Kinder-Liste'))");
  if (!kid || !kid.includes('"by":"kind"') || !kid.includes('"ok":false') || !d.querySelector('.unit')) throw new Error('Kinder-Liste falsch gespeichert: ' + kid);
  const kidId = JSON.parse(kid).id;
  const e1 = w.eval(`DB.play = null; NAV.u = CATALOG.find(x => x.id === 'en').grades[0].books.find(b => b.id === 'eigene').units.find(u => u.custom === '${kidId}'); earn(3, 'kidtest').why`);
  if (e1 !== 'unapproved') throw new Error('Kinder-Liste gibt ohne Freigabe Spielminuten: ' + e1);
  w.eval(`LISTCTX = { kid:false }; showListEditor('${kidId}')`); if (!d.querySelector('#lsave').textContent.includes('freigeben')) throw new Error('Eltern sehen keinen Freigabe-Knopf');
  d.querySelector('#lsave').click();
  const e2 = w.eval(`NAV.u = CATALOG.find(x => x.id === 'en').grades[0].books.find(b => b.id === 'eigene').units.find(u => u.custom === '${kidId}'); earn(3, 'kidtest2').add`);
  if (e2 !== 3) throw new Error('Freigegebene Liste gibt keine Spielminuten: ' + e2);
  w.eval(`LISTCTX = { kid:true }; showListEditor('${kidId}')`); d.querySelector('#lsave').click();
  if (w.eval(`DB.custom['${kidId}'].ok`) !== false) throw new Error('Nach Änderung durch das Kind bleibt die Freigabe bestehen');
  w.eval("DB.play = null; LISTCTX = { kid:false }");
  console.log('OK: Kinder-Listen mit Freigabe');
  // Profile: Testprofil verändert den Lernstand von Profil 1 nicht, ältere App-Version (ohne Profile) löscht nichts
  w.eval("DB.settings.pin = ''; PARENT_OK = true; PTAB = 'home'; parentPanel()"); const s1 = w.eval('DB.stars'), k1 = w.eval('JSON.stringify(DB.known)');
  d.querySelector('#pftest').click();
  if (w.eval('ACTIVE') === 'p1' || w.eval('DB.stars') !== 0 || w.eval('liveProfiles().length') !== 2) throw new Error('Testprofil nicht aktiv oder nicht leer');
  w.eval("DB.stars = 42; DB.known = { x:{ a:1 } }; save()");
  const canon = w.eval('JSON.stringify([toCanon(DB).stars, Object.values(toCanon(DB).pd)[0].stars])');
  if (canon !== JSON.stringify([s1, 42])) throw new Error('Speicherformat der Profile falsch: ' + canon);
  const old = w.eval(`(() => { const c = toCanon(DB), r = { known:c.known, tests:c.tests, stars:c.stars + 1, play:c.play, settings:c.settings, best:c.best, reset:c.reset, games:c.games, custom:c.custom };
    const m = mergeDB(c, r, true); return JSON.stringify([m.stars, Object.values(m.pd)[0].stars, Object.keys(m.profiles).length]); })()`);
  if (old !== JSON.stringify([s1 + 1, 42, 2])) throw new Error('Gerät mit alter Version zerstört Profile: ' + old);
  w.eval("switchProfile('p1')");
  if (w.eval('DB.stars') !== s1 || w.eval('JSON.stringify(DB.known)') !== k1) throw new Error('Lernstand von Profil 1 verändert');
  w.eval("PTAB = 'home'; parentPanel()"); d.querySelector('#pfadd').click(); d.querySelector('#pfname').value = 'Noah'; d.querySelector('#pfsave').click();
  if (w.eval('liveProfiles().length') !== 3 || w.eval('ACTIVE') !== 'p1') throw new Error('Neues Profil falsch angelegt');
  w.eval("showProfiles()"); if (d.querySelectorAll('.mitem:not([data-k="__par"])').length !== 3 || !d.querySelector('[data-k="__par"]')) throw new Error('Profilwahl zeigt nicht alle Profile');
  const tid = w.eval("liveProfiles().find(p => p.test).id"); w.eval(`PTAB = 'prof:${tid}'; parentPanel()`); d.querySelector('#pfdel').click(); d.querySelector('#pfdel2').click();
  if (w.eval('liveProfiles().length') !== 2 || w.eval(`!!DB.pd['${tid}']`)) throw new Error('Profil nicht gelöscht');
  console.log('OK: Profile (Testprofil, Geschwister, alte App-Version)');
  // Pro Profil: Tagesmaximum, Profil-PIN; Eltern-Gerät
  const noah = w.eval("liveProfiles().find(p => p.name === 'Noah').id");
  w.eval(`PTAB = 'prof:${noah}'; parentPanel()`); d.querySelector('#pmax').value = '15'; d.querySelector('#psave').click();
  d.querySelector('#ppin1').value = '4321'; d.querySelector('#ppinset').click();
  if (w.eval(`profMax('${noah}')`) !== 15 || w.eval("profMax('p1')") === 15 || w.eval(`DB.profiles['${noah}'].pin`) !== '4321') throw new Error('Profil-Einstellungen nicht pro Profil');
  w.eval("PARENT_OK = false"); w.eval(`switchProfile('${noah}')`);
  if (w.eval('ACTIVE') !== 'p1' || !d.querySelector('#pf')) throw new Error('Profil-PIN wird nicht abgefragt');
  d.querySelector('#p1').value = '0000'; d.querySelector('#pf').dispatchEvent(new w.Event('submit', { cancelable:true }));
  if (w.eval('ACTIVE') !== 'p1') throw new Error('Falscher Profil-PIN akzeptiert');
  d.querySelector('#p1').value = '4321'; d.querySelector('#pf').dispatchEvent(new w.Event('submit', { cancelable:true }));
  if (w.eval('ACTIVE') !== noah || w.eval('maxMin()') !== 15) throw new Error('Richtiger Profil-PIN wechselt nicht');
  w.eval("switchProfile('p1', true); PARENT_OK = true; PTAB = 'device'; parentPanel()");
  d.querySelector('#dpar').checked = true; d.querySelector('#dpar').onchange({ target:d.querySelector('#dpar') });
  if (!w.eval('DEV.parent')) throw new Error('Eltern-Gerät lässt sich nicht einschalten');
  w.eval("DEV = {}; saveDev(); PTAB = 'home'");
  console.log('OK: Einstellungen pro Profil, Profil-PIN, Eltern-Gerät');
  const cat = w.eval('CATALOG'), games = {};
  for (let si = 0; si < cat.length; si++) for (let gi = 0; gi < cat[si].grades.length; gi++) {
    w.eval(`NAV.s=CATALOG[${si}];NAV.g=NAV.s.grades[${gi}];NAV.n=NAV.g.grade;setColor();showUnits()`);
    const n = d.querySelectorAll('.unit').length;
    for (let u = 0; u < n; u++) {
      w.eval('showUnits()'); d.querySelectorAll('.unit')[u].click(); d.querySelector('#tLearn').click();
      const gl = d.querySelector('.mitem[data-k="gram"]'); if (gl) { gl.click(); if (!d.querySelector('.tip')) throw new Error(`Grammatik-Seite leer: Fach ${si} Unit ${u}`); d.querySelector('#go').click(); if (!d.querySelector('.progress')) throw new Error(`Grammatik-Übung startet nicht: Fach ${si} Unit ${u}`); }
      w.eval('showPractice()'); const k = d.querySelectorAll('.mitem').length; if (!k) throw new Error(`keine Übung: Fach ${si} Unit ${u}`);
      for (let j = 0; j < k; j++) {
        w.eval('showPractice()'); const mk = d.querySelectorAll('.mitem')[j].dataset.k; d.querySelectorAll('.mitem')[j].click();
        if (mk.startsWith('g-')) {
          if (!d.querySelector('#lg')) throw new Error(`Lernspiel startet nicht: Fach ${si} Unit ${u} ${mk}`);
          if (mk === 'g-sort') { const D = w.eval('sortData(NAV.u)'); if (D.items.some(x => !D.bins.includes(x.bin))) throw new Error(`Sortieren: Karte ohne Kiste in Fach ${si} Unit ${u}`); }
          for (let q = 0; q < 4; q++) { const x = d.querySelector('.gopt, .mcard:not(.open):not(.done), .bin'); if (x) x.click(); }
          w.eval('lgFinish()'); if (!d.querySelector('#lgend')) throw new Error(`Lernspiel endet nicht: Fach ${si} Unit ${u} ${mk}`);
          games[mk] = (games[mk] || 0) + 1; continue;
        }
        for (let q = 0; q < 25 && !d.querySelector('.bigstars'); q++) { step(); if (!d.querySelector('.bigstars')) w.eval('nextTask()'); }
        if (!d.querySelector('.bigstars')) throw new Error(`Übung nicht fertig: Fach ${si} Unit ${u} Übung ${j}`);
      }
      w.eval('showTestIntro()'); d.querySelector('#go').click();
      for (let g = 0; g < 60 && !d.querySelector('.note'); g++) { step(); w.eval('nextTask()'); }
      if (!d.querySelector('.note')) throw new Error(`Probetest nicht fertig: Fach ${si} Unit ${u}`);
    }
    console.log(`${cat[si].name} ${cat[si].grades[gi].grade}. Klasse: ${n} Units OK`);
  }
  w.eval('showGame()'); if (d.querySelector('#gGo')) d.querySelector('#gGo').click();
  w.eval("PARENT_OK = false; DB.settings.pin = ''; showParents()"); d.querySelector('#p1').value = '1234'; if (d.querySelector('#p2')) d.querySelector('#p2').value = '1234';
  d.querySelector('#pf').dispatchEvent(new w.Event('submit', { cancelable: true }));
  if (!d.querySelector('.pcard')) throw new Error('Eltern-Bereich öffnet nicht');
  // Hamburger-Menü
  w.eval('closeMenu(); openMenu()'); if (d.getElementById('drawer').hidden || !d.querySelector('[data-m="parents"]')) throw new Error('Menü öffnet nicht');
  d.querySelector('[data-m="home"]').click(); if (!d.getElementById('drawer').hidden || !d.querySelector('.menu')) throw new Error('Menü-Eintrag Start funktioniert nicht');
  if (errs.length) throw new Error('JS-Fehler: ' + errs.slice(0, 3).join(' | '));
  console.log('Lernspiele:', JSON.stringify(games));
  // Schreiben: Gross-/Kleinschreibung im Deutsch, Artikel optional, Englisch ohne
  const ck = w.eval(`JSON.stringify([
    inputCheck({ answer:'das Auge', alts:['das Auge'], cs:true, deart:true, uml:true }, 'Auge').ok,
    inputCheck({ answer:'das Auge', alts:['das Auge'], cs:true, deart:true, uml:true }, 'auge').ok,
    inputCheck({ answer:'das Auge', alts:['das Auge'], cs:true, deart:true, uml:true }, 'auge').caseOnly,
    inputCheck({ answer:'süss', alts:['süss'], cs:true, deart:true, uml:true }, 'suess').ok,
    inputCheck({ answer:'sehen', alts:['sehen'], cs:true, deart:true, uml:true }, 'Sehen').ok,
    inputCheck({ answer:'Library' }, 'library').ok ])`);
  if (ck !== '[true,false,true,true,false,true]') throw new Error('Schreib-Prüfung falsch: ' + ck);
  console.log('OK: Gross- und Kleinschreibung');
  const cp = w.eval(`JSON.stringify([clockPhrase(3,0), clockPhrase(3,15), clockPhrase(3,30), clockPhrase(3,45), clockPhrase(12,45), clockPhrase(3,25), clockPhrase(3,35), clockPhrase(3,40), clockPhrase(11,50)])`);
  if (cp !== JSON.stringify(['3 Uhr','Viertel nach 3','halb 4','Viertel vor 4','Viertel vor 1','5 vor halb 4','5 nach halb 4','20 vor 4','10 vor 12'])) throw new Error('Uhrzeit-Formulierung falsch: ' + cp);
  console.log('OK: Uhrzeiten');
  // Zurücksetzen im Eltern-Bereich
  if (!(w.eval('DB.stars') > 0)) throw new Error('Vor dem Zurücksetzen keine Sterne gesammelt');
  w.eval("PARENT_OK = true; PTAB = 'prof:' + ACTIVE; parentPanel()"); if (!d.querySelector('#pmax')) throw new Error('Profil-Einstellungen fehlen');
  d.querySelector('#pr1').click(); d.querySelector('#pr2').click();
  if (w.eval('DB.stars') !== 0 || w.eval('Object.keys(DB.known).length + Object.keys(DB.tests).length') !== 0 || !w.eval('DB.settings.pin')) throw new Error('Zurücksetzen hat nicht alles gelöscht oder den PIN verloren');
  // Zweites Gerät mit altem Stand darf den Lernstand nicht zurückbringen, neuer Stand nach dem Zurücksetzen bleibt
  const m1 = w.eval(`mergeDB(DB, { known:{ x:{ cat:1 } }, tests:{ x:[{ d:1, note:6 }] }, stars:99, best:50, play:null, settings:DB.settings, reset:0 }, true)`);
  if (m1.stars !== 0 || Object.keys(m1.known).length || Object.keys(m1.tests).length) throw new Error('Alter Stand kommt nach dem Zurücksetzen zurück');
  const m2 = w.eval(`mergeDB({ known:{ x:{ dog:0 } }, tests:{}, stars:1, best:0, play:null, settings:{ max:30, pin:'' }, reset:0 }, Object.assign({}, DB, { stars:3, known:{ y:{ cat:1 } } }), true)`);
  if (m2.stars !== 3 || m2.known.x || !m2.known.y || !m2.reset) throw new Error('Zurücksetzen kommt auf dem zweiten Gerät nicht an');
  console.log('OK: Zurücksetzen');
  // Spielminuten nach Note
  const em = w.eval(`(() => { const o = [];
    DB.play = null; DB.settings.max = 30;
    o.push(noteOf(10,10), noteOf(9,10), noteOf(7,10), noteOf(3,10), earnNote(5, MIN_PRACTICE, 'tF').add, earnNote(5, MIN_TEST, 'tG').add);
    o.push(earnNote(6, MIN_PRACTICE, 'tA').add, earnNote(5.5, MIN_PRACTICE, 'tB').add, earnNote(4, MIN_PRACTICE, 'tC').add, earnNote(4, MIN_TEST, 'tD').add, earnNote(6, MIN_TEST, 'tE', 2).add);
    earnNote(6, MIN_PRACTICE, 'tA'); o.push(earnNote(6, MIN_PRACTICE, 'tA').why);
    SES = { results:[1,2,3,4,5], think:5 * 900 }; o.push(tooFast());
    SES = { results:[1,2,3,4,5], think:5 * 4000 }; o.push(tooFast());
    return JSON.stringify(o); })()`);
  if (em !== JSON.stringify([6, 5.5, 4.5, 2.5, 0, 0, 4, 3, 0, 0, 12, 'repeat', true, false])) throw new Error('Spielminuten-Regeln falsch: ' + em);
  console.log('OK: Spielminuten nach Note');
  // Auswertung: Erfassen, Fehler, Lernpunkte, Zusammenführen
  w.eval("NAV.s = CATALOG[0]; NAV.g = NAV.s.grades[0]; NAV.b = NAV.g.books[0]; NAV.u = NAV.b.units[1]; NAV.n = NAV.g.grade; DB.log = {}; DB.err = []; DB.pt = {}; DB.red = []");
  w.eval("track(true, 4000); track(false, 5000, { q:'<b>dog</b>', a:'dgo', c:'Hund' }); track(false, 3000, { q:'cat', a:'kat', c:'Katze' }); addPoints(50)");
  const lg = w.eval('JSON.stringify([DB.log[today()].n, DB.log[today()].ok, DB.log[today()].s, DB.err.length, DB.err[0].q, pointsOf(DB)])');
  if (lg !== JSON.stringify([3, 1, 12, 2, 'dog', 50])) throw new Error('Erfassung falsch: ' + lg);
  const mg = w.eval(`(() => { const a = toCanon(DB), b = JSON.parse(JSON.stringify(a)); b.log[today()].n = 9; b.err.push({ d:Date.now() + 5, k:'x', q:'q', a:'a', c:'c' }); b.pt[today()] = 70;
    const m = mergeDB(a, b, true); return JSON.stringify([m.log[today()].n, m.err.length, m.pt[today()]]); })()`);
  if (mg !== '[9,3,70]') throw new Error('Auswertung wird falsch zusammengeführt: ' + mg);
  // Dashboard mit Fehler-Liste und Wochenbericht
  w.eval("PARENT_OK = true; PTAB = 'dash:' + ACTIVE; parentPanel()"); if (!d.querySelector('.dbars') || !d.querySelector('.wrep')) throw new Error('Dashboard fehlt');
  const ncl = w.eval('Object.keys(DB.custom).length'); d.querySelector('[data-elist]').click();
  const nlist = w.eval('Object.values(DB.custom).filter(L => !L.del && L.title.startsWith("Fehler üben"))');
  if (w.eval('Object.keys(DB.custom).length') !== ncl + 1 || !nlist.length || nlist[0].items.length !== 2) throw new Error('Fehler-Übungsliste nicht erstellt');
  console.log('OK: Auswertung und Dashboard');
  // Belohnungen: Eltern legen fest, Kind wünscht, Eltern geben frei
  w.eval("PTAB = 'rew'; parentPanel()"); d.querySelector('[data-ridea="1"]').click(); if (w.eval('liveRewards().length') !== 1) throw new Error('Belohnung nicht angelegt');
  w.eval('showRewards()'); d.querySelector('.mitem.rew').click(); d.querySelector('#ryes').click();
  if (w.eval('pointsOf(DB)') !== 25 || w.eval('DB.red[0].st') !== 'offen') throw new Error('Wunsch nicht gespeichert');
  w.eval("PARENT_OK = true; PTAB = 'rew'; parentPanel()"); d.querySelector('[data-rno]').click();
  if (w.eval('pointsOf(DB)') !== 50 || w.eval('DB.red[0].st') !== 'nein') throw new Error('Ablehnen gibt Punkte nicht zurück');
  w.eval('showRewards()'); d.querySelector('.mitem.rew').click(); d.querySelector('#ryes').click(); w.eval("PTAB = 'rew'; parentPanel()"); d.querySelector('[data-rok]').click();
  if (w.eval('pointsOf(DB)') !== 25) throw new Error('Einlösen zieht Punkte nicht ab');
  console.log('OK: Belohnungen');
  // Elternprofile: Admin legt Mama an, Mama setzt eigenen PIN, Profil-PIN mit Mamas PIN
  w.eval("PARENT_OK = true; PARENT_WHO = liveParents()[0].id; PTAB = 'parents'; parentPanel()");
  if (!d.querySelector('#paddok')) throw new Error('Admin sieht Elternverwaltung nicht');
  d.querySelector('#pnm').value = 'Mama'; d.querySelector('#ppn').value = '5555'; d.querySelector('#paddok').click();
  if (w.eval('liveParents().length') !== 2) throw new Error('Elternprofil nicht angelegt');
  w.eval("PARENT_OK = false; PARENT_WHO = null; showParents()"); d.querySelector('#p1').value = '5555'; d.querySelector('#pf').dispatchEvent(new w.Event('submit', { cancelable: true }));
  if (!d.querySelector('#p2')) throw new Error('Mama muss eigenen PIN festlegen');
  d.querySelector('#p1').value = '1234'; d.querySelector('#p2').value = '1234'; d.querySelector('#pf').dispatchEvent(new w.Event('submit', { cancelable: true }));
  if (!d.querySelector('#p2')) throw new Error('Doppelter PIN wurde angenommen');
  d.querySelector('#p1').value = '7777'; d.querySelector('#p2').value = '7777'; d.querySelector('#pf').dispatchEvent(new w.Event('submit', { cancelable: true }));
  if (w.eval('curParent().name') !== 'Mama' || w.eval('curParent().tmp') || !d.querySelector('.pcard')) throw new Error('Mama-Login falsch');
  if (d.querySelector('[data-tab="parents"]')) throw new Error('Nicht-Admin sieht Elternverwaltung');
  if (!w.eval("anyParentPin('7777') && anyParentPin('1234') && !anyParentPin('5555')")) throw new Error('Eltern-PINs falsch');
  if (w.eval('DB.settings.pin') !== '1234') throw new Error('Admin-PIN für alte Versionen fehlt');
  console.log('OK: Elternprofile');
  // Wochenziel und Prüfungsplaner
  w.eval("touchProfile(ACTIVE, { goal:{ min:1, days:1 } }); DB.pt = {}; DB.red = []; NAV.s = CATALOG[0]; NAV.g = NAV.s.grades[0]; NAV.b = NAV.g.books[0]; NAV.u = NAV.b.units[1]; track(true, 30000); track(true, 40000)");
  if (w.eval("DB.pt['W' + dayStr(weekStart(new Date()))]") !== 5) throw new Error('Wochenziel-Bonus fehlt');
  w.eval("track(true, 40000)"); if (w.eval('pointsOf(DB)') !== 5) throw new Error('Wochenziel-Bonus doppelt');
  w.eval("showExamForm(ACTIVE, showHome)"); d.querySelector('#exu input').checked = true; d.querySelector('#exd').value = w.eval('dayStr(addDays(new Date(), 3))'); d.querySelector('#exok').click();
  if (w.eval('liveExams(ACTIVE).length') !== 1 || !d.querySelector('.hx .exam') || !d.querySelector('.hx .goal')) throw new Error('Prüfung nicht auf der Startseite');
  d.querySelector('.hx [data-ou]').click(); if (!w.eval('NAV.u')) throw new Error('Prüfungs-Thema öffnet nicht');
  w.eval("PARENT_OK = true; PTAB = 'dash:' + ACTIVE; parentPanel()"); if (!d.querySelector('.exam') || !d.querySelector('.wrep').textContent.includes('Prüfung in 3 Tagen')) throw new Error('Prüfung fehlt im Dashboard');
  w.eval("Object.values(DB.exams)[0].d = dayStr(addDays(new Date(), -2)); parentPanel()"); d.querySelector('[data-enote]').value = '5,5'; d.querySelector('[data-enotes]').click();
  if (w.eval('liveExams(ACTIVE)[0].note') !== 5.5) throw new Error('Prüfungsnote nicht gespeichert');
  w.eval("PTAB = 'prof:' + ACTIVE; parentPanel()"); d.querySelector('#pgmin').value = '90'; d.querySelector('#pgday').value = '4'; d.querySelector('#pgsave').click();
  if (w.eval('JSON.stringify(goalOf(ACTIVE))') !== '{"min":90,"days":4}') throw new Error('Wochenziel nicht gespeichert');
  console.log('OK: Wochenziel und Prüfungsplaner');
  if (errs.length) throw new Error('JS-Fehler: ' + errs.slice(0, 3).join(' | '));
  console.log('OK: alles durchgeklickt'); process.exit(0);
} catch (e) { console.log('FEHLER:', e.message); process.exit(1); } }, 300);
