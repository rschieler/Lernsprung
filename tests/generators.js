// Prüft alle Aufgaben-Generatoren: node generators.js
const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const w = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w) { w.scrollTo = () => {}; } }).window;
setTimeout(() => {
  let bad = 0;
  for (const g of Object.keys(w.eval('GEN'))) {
    for (let i = 0; i < 3000 && !bad; i++) {
      let r; try { r = w.eval(`GEN.${g}()`); } catch (e) { console.log('FEHLER', g, e.message); bad++; break; }
      const txt = JSON.stringify(r);
      if (r.answer === undefined || /undefined|NaN/.test(String(r.q) + String(r.answer))) { bad++; console.log('leer', g, txt.slice(0, 200)); }
      else if (typeof r.answer === 'number' && (r.answer < 0 || !Number.isInteger(r.answer))) { bad++; console.log('Zahl', g, txt.slice(0, 200)); }
      else if (r.options && !r.options.includes(r.answer)) { bad++; console.log('Antwort fehlt', g, txt.slice(0, 200)); }
      else for (const m of [true, false]) {
        const t = w.eval(`fromGen(${txt}, ${m})`);
        if (t.kind === 'choice' && (t.options.filter(o => o.ok).length !== 1 || t.options.length < 2 || new Set(t.options.map(o => o.label)).size !== t.options.length)) { bad++; console.log('Auswahl', g, m, JSON.stringify(t.options)); break; }
      }
    }
  }
  let qb = 0;
  w.eval('CATALOG').forEach(s => s.grades.forEach(gr => gr.books.forEach(b => b.units.forEach(u => (u.quiz || []).forEach(q => {
    if (q.length < 3 || new Set(q.slice(1)).size !== q.length - 1) { qb++; console.log('Quiz', u.id, q[0]); }
  })))));
  console.log(bad + qb ? `FEHLER: ${bad} Generator, ${qb} Quiz` : 'OK: alle Generatoren und Quizfragen');
  process.exit(bad + qb ? 1 : 0);
}, 300);
