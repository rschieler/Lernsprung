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
  w.eval("DB.settings.pin = ''; parentPanel()");
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
  w.eval('showParents()'); d.querySelector('#p1').value = '1234'; if (d.querySelector('#p2')) d.querySelector('#p2').value = '1234';
  d.querySelector('#pf').dispatchEvent(new w.Event('submit', { cancelable: true }));
  if (!d.querySelector('#pmax')) throw new Error('Eltern-Bereich öffnet nicht');
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
  console.log('OK: alles durchgeklickt'); process.exit(0);
} catch (e) { console.log('FEHLER:', e.message); process.exit(1); } }, 300);
