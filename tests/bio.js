// Browser-Test (Playwright/Chromium): Eltern-Bereich mit Fingerabdruck (virtueller WebAuthn-Sensor). node bio.js
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type':'text/html; charset=utf-8' }); r.end(fs.readFileSync(require('path').join(__dirname, '..', 'index.html'))); }).listen(8765);
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{ width:390, height:844 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/googleapis|gstatic|jsdelivr|firebase/, r => r.abort());
  const cdp = await ctx.newCDPSession(p); await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options:{ protocol:'ctap2', transport:'internal', hasResidentKey:true, hasUserVerification:true, isUserVerified:true, automaticPresenceSimulation:true } });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(400);
  await p.evaluate(() => { DB.settings.pin = '1234'; save(); PARENT_OK = true; PTAB = 'device'; parentPanel(); });
  await p.waitForSelector('#dbioon'); 
  await p.click('#dbioon'); await p.waitForSelector('#dbiooff'); console.log('Eingeschaltet, DEV.bio:', !!(await p.evaluate(() => DEV.bio)));
  await p.evaluate(() => { PARENT_OK = false; showHome(); showParents(); }); await p.waitForSelector('#pbio'); 
  await p.click('#pbio'); await p.waitForSelector('.pcard', { timeout:5000 }).then(() => console.log('Mit Fingerabdruck entsperrt: ja')).catch(() => console.log('Mit Fingerabdruck entsperrt: NEIN'));
  await cdp.send('WebAuthn.setUserVerified', { authenticatorId, isUserVerified:false });
  await p.evaluate(() => { PARENT_OK = false; showHome(); showParents(); }); await p.click('#pbio'); await p.waitForTimeout(1500);
  console.log('Falscher Finger abgewiesen:', !(await p.$('.pcard')));
  await b.close(); srv.close(); if (errs.length) { console.log('FEHLER', errs); process.exit(1); } console.log('OK: Biometrie');
})();
