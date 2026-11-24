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
  const lien = await als('leraar');
  assert.equal(await (await lien('/api/gegevens/vakgroep-wiskunde')).json(), null);
  assert.equal((await bewaar(lien, '/api/gegevens/vakgroep-wiskunde', { naam: 'Wiskunde', score: 3 })).status, 200);
  assert.deepEqual(await (await lien('/api/gegevens/vakgroep-wiskunde')).json(), { naam: 'Wiskunde', score: 3 });
  assert.deepEqual(await (await lien('/api/gegevens?begin=vakgroep-')).json(), [{ naam: 'Wiskunde', score: 3 }]);
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

test('directie en beheerder lezen alle vakgroepen, maar bewaren alleen hun eigen', async () => {
  const mark = await als('middenkader');
  assert.equal((await bewaar(mark, '/api/gegevens/vakgroep-frans', { naam: 'Frans', score: 2 })).status, 200);
  for (const id of ['directie', 'beheerder']) {
    const wie = await als(id);
    assert.deepEqual(await (await wie('/api/gegevens/vakgroep-frans')).json(), { naam: 'Frans', score: 2 });
    assert.ok((await (await wie('/api/gegevens?begin=vakgroep-')).json()).some((v) => v.naam === 'Frans'));
    assert.equal((await wie('/api/uitchecken/vakgroep-frans')).status, 200); // live meekijken mag
    assert.equal((await bewaar(wie, '/api/gegevens/vakgroep-frans', { naam: 'Frans', score: 4 })).status, 403);
    assert.equal((await wie('/api/uitchecken/vakgroep-frans', { method: 'POST' })).status, 403);
  }
  assert.deepEqual(await (await mark('/api/gegevens/vakgroep-frans')).json(), { naam: 'Frans', score: 2 });
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
  await Promise.all([...Array(10).keys()].map((nr) => bewaar(directie, '/api/gegevens/proef-tegelijk', groot(nr))));
  const bewaard = await (await directie('/api/gegevens/proef-tegelijk')).json();
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

test('uitchecken: wie bezig is houdt het bestand, een ander kan niet bewaren tot het weer vrij is', async () => {
  const lien = await als('leraar');
  const mark = await als('middenkader');
  const pad = '/api/gegevens/vakgroep-wiskunde';
  const slot = '/api/uitchecken/vakgroep-wiskunde';
  assert.equal((await fetch(BASIS + slot)).status, 401);
  assert.equal((await (await als('leraar'))('/api/uitchecken/vakgroep-frans', { method: 'POST' })).status, 403);

  assert.equal((await lien(slot, { method: 'POST' })).status, 200);
  assert.equal((await lien(slot, { method: 'POST' })).status, 200); // verlengen mag
  const geweigerd = await mark(slot, { method: 'POST' });
  assert.equal(geweigerd.status, 409);
  assert.equal((await geweigerd.json()).door, 'Lien Leraar');
  assert.equal((await (await mark(slot)).json()).door, 'Lien Leraar');
  assert.equal((await (await lien(slot)).json()).door, '');

  assert.equal((await bewaar(mark, pad, { naam: 'Wiskunde', van: 'Mark' })).status, 409);
  assert.equal((await bewaar(lien, pad, { naam: 'Wiskunde', van: 'Lien' })).status, 200);
  assert.equal((await mark(slot, { method: 'DELETE' })).status, 200); // een ander kan het niet vrijgeven
  assert.equal((await bewaar(mark, pad, { naam: 'Wiskunde', van: 'Mark' })).status, 409);

  assert.equal((await lien(slot, { method: 'DELETE' })).status, 200);
  assert.equal((await bewaar(mark, pad, { naam: 'Wiskunde', van: 'Mark' })).status, 200);
});

test('versie: wie een verouderde versie voor zich heeft, kan niet bewaren of uitchecken', async () => {
  const lien = await als('leraar');
  const mark = await als('middenkader');
  const pad = '/api/gegevens/vakgroep-wiskunde';
  const slot = '/api/uitchecken/vakgroep-wiskunde';
  const geladen = (await mark(pad)).headers.get('x-versie');
  assert.equal((await (await mark(slot)).json()).versie, geladen);

  const r = await bewaar(lien, `${pad}?versie=${geladen}`, { naam: 'Wiskunde', van: 'Lien', stap: 2 });
  assert.equal(r.status, 200);
  const nieuw = (await r.json()).versie;
  assert.notEqual(nieuw, geladen);
  assert.equal((await (await mark(slot)).json()).versie, nieuw);

  // Mark heeft nog de oude versie: bewaren en uitchecken worden geweigerd, en het werk van Lien blijft staan
  const oud = await bewaar(mark, `${pad}?versie=${geladen}`, { naam: 'Wiskunde', van: 'Mark' });
  assert.equal(oud.status, 409);
  assert.equal((await oud.json()).verouderd, true);
  assert.equal((await mark(`${slot}?versie=${geladen}`, { method: 'POST' })).status, 409);
  assert.equal((await (await lien(slot)).json()).door, ''); // de geweigerde uitcheck houdt niets vast
  assert.equal((await (await mark(pad)).json()).van, 'Lien');

  // met de nieuwste versie lukt het wel
  assert.equal((await mark(`${slot}?versie=${nieuw}`, { method: 'POST' })).status, 200);
  assert.equal((await bewaar(mark, `${pad}?versie=${nieuw}`, { naam: 'Wiskunde', van: 'Mark' })).status, 200);
  assert.equal((await mark(slot, { method: 'DELETE' })).status, 200);
});

test('tegelijk uitchecken: maar één van beiden krijgt het bestand', async () => {
  const lien = await als('leraar');
  const mark = await als('middenkader');
  const slot = '/api/uitchecken/vakgroep-wiskunde';
  const versie = (await (await lien(slot)).json()).versie;
  const uitkomst = await Promise.all([lien, mark].map((wie) => wie(`${slot}?versie=${versie}`, { method: 'POST' })));
  assert.deepEqual(uitkomst.map((r) => r.status).sort(), [200, 409]);
  await Promise.all([lien, mark].map((wie) => wie(slot, { method: 'DELETE' })));
});

test('onderhoud: het Vakgroepkompas offline halen houdt alle vakgroepen vast, en kan alleen als niemand bezig is', async () => {
  const lien = await als('leraar');
  const bea = await als('beheerder');
  const pad = '/api/gegevens/vakgroep-wiskunde';
  const slot = '/api/uitchecken/vakgroep-wiskunde';
  const onderdelen = '/api/gegevens/vakgroepcompas-onderdelen';
  const onderhoud = '/api/uitchecken/vakgroepcompas-onderdelen';
  assert.equal((await lien(onderhoud, { method: 'POST' })).status, 403);
  assert.equal((await bewaar(bea, onderdelen, { onderdelen: [] })).status, 409); // eerst offline halen

  // Lien is bezig in Wiskunde: offline halen wordt geweigerd, met haar naam en de vakgroep
  await bewaar(lien, pad, { name: 'Wiskunde', sc: {} });
  assert.equal((await lien(slot, { method: 'POST' })).status, 200);
  const geweigerd = await bea(onderhoud, { method: 'POST' });
  assert.equal(geweigerd.status, 409);
  assert.deepEqual(await geweigerd.json().then((x) => [x.door, x.vakgroep]), ['Lien Leraar', 'Wiskunde']);
  await lien(slot, { method: 'DELETE' });

  // nu lukt het: Lien kan niets meer uitchecken of bewaren, Bea wel
  assert.equal((await bea(onderhoud, { method: 'POST' })).status, 200);
  const toestand = await (await lien(slot)).json();
  assert.deepEqual([toestand.door, toestand.onderhoud], ['Bea Beheerder', true]);
  assert.equal((await lien(slot, { method: 'POST' })).status, 409);
  assert.equal((await bewaar(lien, pad, { name: 'Wiskunde', sc: { a: 1 } })).status, 409);
  assert.equal((await bewaar(bea, onderdelen, { onderdelen: [], stap: 1 })).status, 200);
  assert.notEqual((await (await lien(slot)).json()).onderdelen, toestand.onderdelen); // Lien ziet dat de onderdelen wijzigden

  // na vrijgeven blijft alles nog even vast (buffer), ook voor Bea zelf
  assert.equal((await bea(onderhoud, { method: 'DELETE' })).status, 200);
  assert.equal((await (await lien(slot)).json()).onderhoud, true);
  assert.equal((await lien(slot, { method: 'POST' })).status, 409);
  assert.equal((await bewaar(bea, onderdelen, { onderdelen: [], stap: 2 })).status, 409);
  assert.equal((await bea(onderhoud, { method: 'POST' })).status, 200); // Bea kan wel opnieuw offline halen
  assert.equal((await bea(onderhoud, { method: 'DELETE' })).status, 200);
});

test('een onderdeel definitief verwijderen mag alleen wie het recht onderdelen-verwijderen heeft', async () => {
  const directie = await als('directie');
  const bea = await als('beheerder');
  const onderhoud = '/api/uitchecken/vakgroepcompas-onderdelen';
  const onderdelen = '/api/gegevens/vakgroepcompas-onderdelen';
  // wacht tot de buffer van een vorig onderhoud voorbij is
  for (let i = 0; i < 60 && (await directie(onderhoud, { method: 'POST' })).status !== 200; i++) {
    await new Promise((klaar) => setTimeout(klaar, 250));
  }
  const a = { id: 'a', t: 'A', l: [], tp: [] };
  const b = { id: 'b', t: 'B', l: [], tp: [] };
  assert.equal((await bewaar(directie, onderdelen, { onderdelen: [a, b], archief: [] })).status, 200);
  assert.equal((await bewaar(directie, onderdelen, { onderdelen: [a], archief: [b] })).status, 200); // archiveren mag
  assert.equal((await bewaar(directie, onderdelen, { onderdelen: [a], archief: [] })).status, 403);
  assert.equal((await bewaar(directie, onderdelen, { onderdelen: [a], archief: [{ id: 'b' }] })).status, 403); // onbruikbaar maken = verwijderen
  assert.deepEqual((await (await directie(onderdelen)).json()).archief, [b]);
  await directie(onderhoud, { method: 'DELETE' });
  for (let i = 0; i < 60 && (await bea(onderhoud, { method: 'POST' })).status !== 200; i++) {
    await new Promise((klaar) => setTimeout(klaar, 250));
  }
  assert.equal((await bewaar(bea, onderdelen, { onderdelen: [a], archief: [] })).status, 200);
  await bea(onderhoud, { method: 'DELETE' });
});

test('deadlines: iedereen leest ze, alleen wie de instellingen mag, bewaart ze', async () => {
  const lien = await als('leraar');
  const directie = await als('directie');
  const deadlines = '/api/gegevens/vakgroepcompas-deadlines';
  assert.equal(await (await lien(deadlines)).json(), null);
  const inhoud = { uitleg: 'Dit zijn de deadlines.', deadlines: [{ d: '2027-01-15', n: 'Planning', t: '' }] };
  assert.equal((await bewaar(lien, deadlines, inhoud)).status, 403);
  assert.equal((await bewaar(directie, deadlines, inhoud)).status, 200);
  assert.deepEqual(await (await lien(deadlines)).json(), inhoud);
});
