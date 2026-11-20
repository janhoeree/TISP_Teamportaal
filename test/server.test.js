// Start de echte server op een vrije poort met een lege, tijdelijke gegevensmap en test de belangrijkste afspraken.
// Uitvoeren: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const POORT = 8765;
const BASIS = `http://127.0.0.1:${POORT}`;
const MAP = fs.mkdtempSync(path.join(os.tmpdir(), 'teamportaal-test-'));
let server;

test.before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: { ...process.env, PORT: String(POORT), HOST: '127.0.0.1', GEGEVENS_MAP: MAP },
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${BASIS}/health`)).ok) return; } catch { /* nog niet gestart */ }
    await new Promise((klaar) => setTimeout(klaar, 100));
  }
  throw new Error('De server is niet gestart.');
});

test.after(() => {
  server.kill();
  fs.rmSync(MAP, { recursive: true, force: true });
});

// Meldt aan als een testgebruiker en geeft een fetch terug die de sessiecookie meestuurt.
async function als(id) {
  const r = await fetch(`${BASIS}/api/aanmelden`, { method: 'POST', body: JSON.stringify({ id }) });
  assert.equal(r.status, 200);
  const cookie = r.headers.get('set-cookie').split(';')[0];
  return (pad, opties = {}) => fetch(BASIS + pad, { ...opties, headers: { cookie } });
}
const bewaar = (vraag, pad, inhoud) => vraag(pad, { method: 'PUT', body: JSON.stringify(inhoud) });

test('de website en /health werken zonder aanmelden', async () => {
  assert.equal((await fetch(`${BASIS}/health`)).status, 200);
  assert.equal((await fetch(`${BASIS}/login.html`)).status, 200);
});

test('zonder aanmelden krijg je geen gegevens', async () => {
  assert.equal((await fetch(`${BASIS}/api/gegevens/vakgroep-wiskunde`)).status, 401);
  assert.equal((await fetch(`${BASIS}/api/gebruikers`)).status, 401);
});

test('bewaren en laden: wat je bewaart, krijg je terug en staat in GEGEVENS_MAP', async () => {
  const directie = await als('directie');
  assert.equal(await (await directie('/api/gegevens/vakgroep-wiskunde')).json(), null);
  assert.equal((await bewaar(directie, '/api/gegevens/vakgroep-wiskunde', { naam: 'Wiskunde', score: 3 })).status, 200);
  assert.deepEqual(await (await directie('/api/gegevens/vakgroep-wiskunde')).json(), { naam: 'Wiskunde', score: 3 });
  assert.deepEqual(await (await directie('/api/gegevens?begin=vakgroep-')).json(), [{ naam: 'Wiskunde', score: 3 }]);
  assert.ok(fs.existsSync(path.join(MAP, 'vakgroep-wiskunde.json')));
});

test('een leraar komt niet aan een vakgroep die niet van hem is', async () => {
  const leraar = await als('leraar');
  const ik = await (await leraar('/api/ik')).json();
  const vreemd = 'vakgroep-bestaat-niet';
  assert.ok(!ik.vakgroepen.some((v) => v.naam.toLowerCase() === 'bestaat-niet'));
  assert.equal((await leraar(`/api/gegevens/${vreemd}`)).status, 403);
  assert.equal((await bewaar(leraar, `/api/gegevens/${vreemd}`, {})).status, 403);
  assert.equal((await leraar('/api/gegevens/gebruikers')).status, 403);
});

test('gebruikers en vakgroepen: alleen wie mag beheren', async () => {
  const leraar = await als('leraar');
  const directie = await als('directie');
  assert.equal((await bewaar(leraar, '/api/vakgroepen', ['Test'])).status, 403);
  const vakgroepen = await (await directie('/api/vakgroepen')).json();
  assert.equal((await bewaar(directie, '/api/vakgroepen', [...vakgroepen, 'Testvak'])).status, 200);
  assert.ok((await (await leraar('/api/vakgroepen')).json()).includes('Testvak'));
  assert.ok(fs.existsSync(path.join(MAP, 'vakgroepen.json')));
});

test('mijn vakgroepen op de resultatenpagina: per gebruiker bewaard', async () => {
  const directie = await als('directie');
  assert.deepEqual(await (await directie('/api/mijn_vakgroepen_resultaten')).json(), []);
  assert.equal((await bewaar(directie, '/api/mijn_vakgroepen_resultaten', ['Frans', 'Frans', 'Wiskunde'])).status, 200);
  assert.deepEqual(await (await directie('/api/mijn_vakgroepen_resultaten')).json(), ['Frans', 'Wiskunde']);
  assert.equal((await (await als('leraar'))('/api/mijn_vakgroepen_resultaten')).status, 403);
});

test('tegelijk bewaren: het bestand blijft leesbaar en niemand verliest zijn wijziging', async () => {
  const directie = await als('directie');
  const beheerder = await als('beheerder');
  const groot = (nr) => ({ nr, tekst: 'x'.repeat(200000 + nr * 50000) });
  await Promise.all([...Array(10).keys()].map((nr) => bewaar(directie, '/api/gegevens/vakgroep-tegelijk', groot(nr))));
  const bewaard = await (await directie('/api/gegevens/vakgroep-tegelijk')).json();
  assert.deepEqual(bewaard, groot(bewaard.nr));

  for (let ronde = 0; ronde < 10; ronde++) {
    await Promise.all([
      bewaar(directie, '/api/mijn_vakgroepen_resultaten', [`D${ronde}`]),
      bewaar(beheerder, '/api/mijn_vakgroepen_resultaten', [`B${ronde}`]),
    ]);
    assert.deepEqual(await (await directie('/api/mijn_vakgroepen_resultaten')).json(), [`D${ronde}`]);
    assert.deepEqual(await (await beheerder('/api/mijn_vakgroepen_resultaten')).json(), [`B${ronde}`]);
  }
});
