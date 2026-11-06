// Verschlüsselte Synchronisation mit nachgebautem Firestore (im Speicher): Umstellung, zweites Gerät, Einladung, Betreiber-Bereich. node sync.js
const { JSDOM, VirtualConsole } = require('jsdom'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const STORE = new Map(); // 'coll/id' -> data
const listeners = new Map(); let DENY = false;
const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
function fakeFirebase(user){
  const notify = k => (listeners.get(k) || []).forEach(f => f());
  const docRef = (c, id) => { const k = c + '/' + id; return {
    get: async () => { if (DENY && c === 'fam2') throw { code:'permission-denied' }; return { exists:STORE.has(k), data:() => clone(STORE.get(k)) }; },
    set: async (d, o) => { STORE.set(k, o && o.merge ? Object.assign({}, STORE.get(k) || {}, clone(d)) : clone(d)); notify(k); },
    update: async d => { if (!STORE.has(k)) throw { code:'not-found' }; STORE.set(k, Object.assign({}, STORE.get(k), clone(d))); notify(k); },
    delete: async () => { STORE.delete(k); notify(k); },
    onSnapshot: (next) => { const f = () => setTimeout(() => next({ exists:STORE.has(k), data:() => clone(STORE.get(k)), metadata:{ hasPendingWrites:false } }), 5);
      listeners.set(k, (listeners.get(k) || []).concat(f)); f(); return () => {}; } }; };
  const fsApi = { collection: c => ({ doc: id => docRef(c, id), get: async () => ({ docs:[...STORE.keys()].filter(k => k.startsWith(c + '/')).map(k => ({ id:k.slice(c.length + 1), data:() => clone(STORE.get(k)) })) }) }) };
  const auth = { currentUser:user || null, onAuthStateChanged(cb){ setTimeout(cb, 0); return () => {}; }, async signInAnonymously(){ this.currentUser = { isAnonymous:true }; }, signOut: async () => {} };
  const fb = { apps:[], initializeApp(){ this.apps.push(1); }, auth:() => auth, firestore:() => fsApi };
  fb.auth.GoogleAuthProvider = function(){ this.setCustomParameters = () => {}; };
  return fb;
}
function open(url, user){
  const vc = new VirtualConsole(); const errs = []; vc.on('jsdomError', e => { if (!/navigation|Not implemented/.test(e.message)) errs.push(e.message); });
  const w = new JSDOM(html, { url, runScripts:'dangerously', pretendToBeVisual:true, virtualConsole:vc, beforeParse(w){
    w.scrollTo = () => {}; w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; w.firebase = fakeFirebase(user);
    try { Object.defineProperty(w.crypto, 'subtle', { value:require('crypto').webcrypto.subtle }); } catch (e) {}
    w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get:() => () => ({ addColorStop(){} }), set:() => true }); } }).window;
  w.errs = errs; return w;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => { try {
  const CODE = 'abcdefghjkmnpqrstuvw';
  STORE.set('families/' + CODE, { stars:7, best:0, known:{ 'en-4-yw2-u1':{ nose:1 } }, tests:{}, play:null, settings:{ max:30, pin:'1234' }, reset:0, games:{}, custom:{},
    profiles:{ p1:{ id:'p1', name:'Lina', icon:'🦘', t:1 } }, pd:{}, updated:1 });
  // 1. Umstellung auf verschlüsselt
  const a = open('https://rschieler.github.io/Lernsprung/?f=' + CODE); await wait(2600);
  const ids = [...STORE.keys()].filter(k => k.startsWith('fam2/'));
  if (a.eval('DB.stars') !== 7) throw new Error('Alter Stand nicht übernommen: ' + a.eval('DB.stars'));
  if (ids.length !== 1) throw new Error('Verschlüsseltes Dokument fehlt');
  const doc = STORE.get(ids[0]), raw = JSON.stringify(doc);
  if (!doc.c || doc.inv !== 'alt' || doc.v !== 2 || /Lina|nose|1234/.test(raw)) throw new Error('Dokument nicht verschlüsselt: ' + raw.slice(0, 200));
  if (STORE.has('families/' + CODE)) throw new Error('Alter Klartext-Stand nicht gelöscht');
  if (doc.kids !== 1) throw new Error('Metadaten falsch');
  // 2. Zweites Gerät liest und entschlüsselt
  const b = open('https://rschieler.github.io/Lernsprung/?f=' + CODE); await wait(1500);
  if (b.eval('DB.stars') !== 7 || b.eval('DB.profiles.p1.name') !== 'Lina') throw new Error('Zweites Gerät entschlüsselt nicht');
  b.eval('DB.stars = 9; save()'); await wait(2500);
  if (a.eval('DB.stars') !== 9) throw new Error('Änderung kommt auf dem ersten Gerät nicht an');
  console.log('OK: Verschlüsselung, Umstellung, zwei Geräte');
  // 3. Einladung annehmen
  STORE.set('invites/invtestinvtestinvtest', { name:'Familie Test', created:1, used:null, blocked:false });
  const c = open('https://rschieler.github.io/Lernsprung/?i=invtestinvtestinvtest'); await wait(800);
  if (!c.document.querySelector('#ivgo') || !c.document.body.textContent.includes('Familie Test')) throw new Error('Einladung wird nicht angezeigt');
  c.document.querySelector('#ivok').checked = true; c.document.querySelector('#ivgo').click(); await wait(800);
  const inv = STORE.get('invites/invtestinvtestinvtest'), fam = [...STORE.keys()].filter(k => k.startsWith('fam2/'));
  if (!inv.used || fam.length !== 2 || STORE.get('fam2/' + inv.used).inv !== 'invtestinvtestinvtest') throw new Error('Familie aus Einladung nicht angelegt');
  const d2 = open('https://rschieler.github.io/Lernsprung/?i=invtestinvtestinvtest'); await wait(800);
  if (!d2.document.body.textContent.includes('schon benutzt')) throw new Error('Benutzte Einladung nicht erkannt');
  console.log('OK: Einladung');
  // 4. Betreiber-Bereich: sieht Familien, aber keine Inhalte
  const e = open('https://rschieler.github.io/Lernsprung/?admin', { email:'ronny.schieler@gmail.com', isAnonymous:false }); await wait(800);
  const t = e.document.querySelector('#app').textContent;
  if (!t.includes('Familie Test') || !t.includes('Familie ohne Namen') || /Lina/.test(t)) throw new Error('Betreiber-Bereich falsch: ' + t.slice(0, 300));
  [...e.document.querySelectorAll('[data-fren]')].find(x => x.closest('div').textContent.includes('Familie ohne Namen')).click(); e.document.querySelector('#frenv').value = 'Familie Schieler'; e.document.querySelector('#frenok').click(); await wait(500);
  const famList = e.document.querySelector('.rlist.adm').textContent;
  if (!famList.includes('Familie Schieler') || famList.includes('Familie ohne Namen')) throw new Error('Familie umbenennen geht nicht');
  if ([...e.document.querySelectorAll('.rlist.adm')].pop().textContent.includes('Familie Schieler')) throw new Error('Namens-Eintrag erscheint bei den Einladungen');
  e.document.querySelector('#ainm').value = 'Familie Neu'; e.document.querySelector('#ainv').click(); await wait(500);
  if (![...STORE.values()].some(v => v.name === 'Familie Neu' && v.used === null)) throw new Error('Einladung nicht erstellt');
  const f = open('https://rschieler.github.io/Lernsprung/?admin', { email:'fremd@example.com', isAnonymous:false }); await wait(600);
  if (!f.document.querySelector('#agl') || f.document.querySelector('#ainv')) throw new Error('Fremde sehen den Betreiber-Bereich');
  console.log('OK: Betreiber-Bereich');
  // 5. Familie löschen
  a.eval("PARENT_OK = true; PARENT_WHO = liveParents()[0].id; PTAB = 'family'; parentPanel()");
  a.document.querySelector('#fdel').click(); a.document.querySelector('#fdelc').value = 'löschen'; a.document.querySelector('#fdel2').click(); await wait(400);
  if (STORE.has(ids[0])) throw new Error('Familie nicht gelöscht');
  const errs = [a, b, c, d2, e, f].flatMap(x => x.errs); if (errs.length) throw new Error('JS-Fehler: ' + errs.slice(0, 3).join(' | '));
  console.log('OK: Familie löschen');
  // 6. Regeln noch nicht umgestellt: wie bisher unverschlüsselt weiter
  DENY = true; STORE.set('families/zzzzzzzzzzzzzzzzzzzz', { stars:3, known:{}, tests:{}, settings:{ max:30, pin:'' }, profiles:{}, pd:{} });
  const g = open('https://rschieler.github.io/Lernsprung/?f=zzzzzzzzzzzzzzzzzzzz'); await wait(1500);
  if (g.eval('DB.stars') !== 3 || !STORE.has('families/zzzzzzzzzzzzzzzzzzzz') || g.eval('SYNC.state') !== 'ok') throw new Error('Rückfall auf alten Stand geht nicht');
  console.log('OK: Rückfall ohne neue Regeln'); process.exit(0);
} catch (e) { console.log('FEHLER:', e.message); process.exit(1); } })();
