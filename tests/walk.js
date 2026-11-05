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
  const cat = w.eval('CATALOG');
  for (let si = 0; si < cat.length; si++) {
    w.eval(`NAV.n=4;NAV.s=CATALOG[${si}];NAV.g=NAV.s.grades[0];setColor();showUnits()`);
    const n = d.querySelectorAll('.unit').length;
    for (let u = 0; u < n; u++) {
      w.eval('showUnits()'); d.querySelectorAll('.unit')[u].click(); d.querySelector('#tLearn').click();
      const gl = d.querySelector('.mitem[data-k="gram"]'); if (gl) { gl.click(); if (!d.querySelector('.tip')) throw new Error(`Grammatik-Seite leer: Fach ${si} Unit ${u}`); d.querySelector('#go').click(); if (!d.querySelector('.progress')) throw new Error(`Grammatik-Übung startet nicht: Fach ${si} Unit ${u}`); }
      w.eval('showPractice()'); const k = d.querySelectorAll('.mitem').length; if (!k) throw new Error(`keine Übung: Fach ${si} Unit ${u}`);
      for (let j = 0; j < k; j++) {
        w.eval('showPractice()'); d.querySelectorAll('.mitem')[j].click();
        for (let q = 0; q < 25 && !d.querySelector('.bigstars'); q++) { step(); if (!d.querySelector('.bigstars')) w.eval('nextTask()'); }
        if (!d.querySelector('.bigstars')) throw new Error(`Übung nicht fertig: Fach ${si} Unit ${u} Übung ${j}`);
      }
      w.eval('showTestIntro()'); d.querySelector('#go').click();
      for (let g = 0; g < 60 && !d.querySelector('.note'); g++) { step(); w.eval('nextTask()'); }
      if (!d.querySelector('.note')) throw new Error(`Probetest nicht fertig: Fach ${si} Unit ${u}`);
    }
    console.log(`${cat[si].name}: ${n} Units OK`);
  }
  w.eval('showGame()'); if (d.querySelector('#gGo')) d.querySelector('#gGo').click();
  w.eval('showParents()'); d.querySelector('#p1').value = '1234'; if (d.querySelector('#p2')) d.querySelector('#p2').value = '1234';
  d.querySelector('#pf').dispatchEvent(new w.Event('submit', { cancelable: true }));
  if (!d.querySelector('#pmax')) throw new Error('Eltern-Bereich öffnet nicht');
  if (errs.length) throw new Error('JS-Fehler: ' + errs.slice(0, 3).join(' | '));
  console.log('OK: alles durchgeklickt'); process.exit(0);
} catch (e) { console.log('FEHLER:', e.message); process.exit(1); } }, 300);
