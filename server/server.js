// Lokale server van het TISP Teamportaal.
// Doet maar 3 dingen:
//  1. de website in public/ tonen in de browser;
//  2. bijhouden wie er aangemeld is (aanmelding.js) en wat die mag (rechten.js, gebruikers.js);
//  3. gegevens bewaren en teruggeven via opslag.js (nu: JSON-bestanden in de map gegevens/).
// Poort, adres en de map met gegevens staan in instellingen.js.
// De server weet niets over de apps zelf: elke app bewaart gewoon "een bestand met een naam".
// Enkel wélke bestanden iemand mag lezen of bewaren, staat op één plek: magBestand() in rechten.js.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const aanmelding = require('./aanmelding');
const gebruikers = require('./gebruikers');
const mijnVakgroepenResultaten = require('./mijn_vakgroepen_resultaten');
const opslag = require('./opslag');
const uitchecken = require('./uitchecken');
const { magBestand } = require('./rechten');
const { POORT, ADRES, GEGEVENS_MAP } = require('./instellingen');
const { stuur, leesJson } = require('./hulp');

const WEBSITE = path.join(__dirname, '..', 'public');
const SOORTEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

// GET  /api/gegevens?begin=vakgroep-   → lijst van alle bestanden die zo beginnen
// GET  /api/gegevens/vakgroep-wiskunde → wat er onder de naam vakgroep-wiskunde bewaard is (null als het nog niet bestaat)
// PUT  /api/gegevens/vakgroep-wiskunde → bewaart de meegestuurde JSON onder die naam
// Elke GET van één naam geeft in de kop X-Versie mee welke versie dit is (zie versie() in uitchecken.js).
// Een PUT wordt geweigerd (409) als een collega de naam heeft uitgecheckt, of als je ?versie=... meestuurt
// en er intussen een andere versie bewaard is. De onderdelen van het Vakgroepkompas bewaar je alleen terwijl
// je het Vakgroepkompas offline hebt gehaald (zie Onderhoud in uitchecken.js).
// Alleen wie aangemeld is, mag gegevens lezen of bewaren, en enkel de namen die magBestand() toestaat
// (bv. een leraar alleen zijn eigen vakgroepen).
async function gegevens(req, res, adres) {
  const ik = await aanmelding.gebruikerVan(req);
  if (!ik) return stuur(res, 401, '{"fout":"Niet aangemeld."}');
  const naam = adres.pathname.slice('/api/gegevens/'.length);

  if (!naam && req.method === 'GET') {
    const begin = adres.searchParams.get('begin') || '';
    const lijst = [];
    for (const gevonden of await opslag.lijst(begin)) {
      if (!magBestand(ik, gevonden, 'GET')) continue;
      try {
        lijst.push(await opslag.lees(gevonden));
      } catch {
        console.warn(`Overgeslagen (geen geldige JSON): ${gevonden}`);
      }
    }
    return stuur(res, 200, JSON.stringify(lijst));
  }

  if (!/^[a-z0-9-]+$/.test(naam)) return stuur(res, 400, '{"fout":"Ongeldige naam."}');
  if (!magBestand(ik, naam, req.method)) return stuur(res, 403, '{"fout":"Geen toegang tot deze gegevens."}');

  if (req.method === 'GET') {
    const inhoud = await opslag.lees(naam); // null als het nog niet bestaat
    return stuur(res, 200, JSON.stringify(inhoud), undefined, { 'X-Versie': uitchecken.versie(inhoud) });
  }

  if (req.method === 'PUT') {
    const inhoud = await leesJson(req);
    if (inhoud === undefined) return stuur(res, 400, '{"fout":"Geen geldige JSON."}');
    const door = uitchecken.door(naam, ik);
    if (door) return stuur(res, 409, JSON.stringify({ fout: 'Iemand anders is dit aan het bewerken.', door }));
    if (naam === uitchecken.ONDERHOUD && !uitchecken.isVan(naam, ik)) {
      return stuur(res, 409, '{"fout":"Haal het Vakgroepkompas eerst offline voor onderhoud."}');
    }
    const verwacht = adres.searchParams.get('versie');
    let verouderd = false;
    await opslag.wijzig(naam, (oud) => {
      verouderd = verwacht !== null && verwacht !== uitchecken.versie(oud);
      return verouderd ? undefined : inhoud;
    });
    if (verouderd) return stuur(res, 409, '{"fout":"Er is intussen een nieuwere versie bewaard.","verouderd":true}');
    return stuur(res, 200, JSON.stringify({ ok: true, versie: uitchecken.versie(inhoud) }));
  }

  stuur(res, 405, '{"fout":"Niet toegestaan."}');
}

// GET    /api/uitchecken/vakgroep-wiskunde → { versie, door }: de bewaarde versie en wie het nu tegenhoudt ('' = niemand anders).
//                                            Bij een vakgroep ook { onderhoud, onderdelen }: is het Vakgroepkompas offline,
//                                            en welke versie van de onderdelen is bewaard.
// POST   /api/uitchecken/vakgroep-wiskunde → checkt uit voor jou (of verlengt). 409 als een collega bezig is, of als je
//                                            ?versie=... meestuurt en er intussen een andere versie bewaard is.
// DELETE /api/uitchecken/vakgroep-wiskunde → geeft weer vrij
// De naam vakgroepcompas-onderdelen uitchecken haalt het hele Vakgroepkompas offline (zie Onderhoud in uitchecken.js).
async function uitcheck(req, res, adres) {
  const ik = await aanmelding.gebruikerVan(req);
  if (!ik) return stuur(res, 401, '{"fout":"Niet aangemeld."}');
  const naam = adres.pathname.slice('/api/uitchecken/'.length);
  if (!/^[a-z0-9-]+$/.test(naam)) return stuur(res, 400, '{"fout":"Ongeldige naam."}');
  if (!magBestand(ik, naam, req.method === 'GET' ? 'GET' : 'PUT')) return stuur(res, 403, '{"fout":"Geen toegang tot deze gegevens."}');

  if (req.method === 'GET') {
    const bezet = uitchecken.bezet(naam, ik) || { naam: '' };
    const toestand = { versie: uitchecken.versie(await opslag.lees(naam)), door: bezet.naam };
    if (naam.startsWith('vakgroep-')) {
      toestand.onderhoud = !!bezet.onderhoud;
      toestand.onderdelen = uitchecken.versie(await opslag.lees(uitchecken.ONDERHOUD));
    }
    return stuur(res, 200, JSON.stringify(toestand));
  }

  if (req.method === 'POST') {
    const bezet = uitchecken.bezet(naam, ik);
    if (bezet) {
      // bezet.bestand: de vakgroep waarin een collega bezig is, als je het Vakgroepkompas offline wilt halen
      const vakgroep = bezet.bestand ? ((await opslag.lees(bezet.bestand)) || {}).name || bezet.bestand.slice('vakgroep-'.length) : undefined;
      return stuur(res, 409, JSON.stringify({ fout: 'Iemand anders is dit aan het bewerken.', door: bezet.naam, vakgroep }));
    }
    const verwacht = adres.searchParams.get('versie');
    if (verwacht !== null && !uitchecken.isVan(naam, ik)) {
      // Lezen en uitchecken in één stap (via de wachtrij van opslag), zodat er geen bewaring tussen kan komen.
      let verouderd = false;
      await opslag.wijzig(naam, (oud) => {
        verouderd = verwacht !== uitchecken.versie(oud) || !!uitchecken.door(naam, ik);
        if (!verouderd) uitchecken.neem(naam, ik);
      });
      if (verouderd) return stuur(res, 409, '{"fout":"Er is intussen een nieuwere versie bewaard.","verouderd":true}');
    } else uitchecken.neem(naam, ik);
    return stuur(res, 200, '{"ok":true}');
  }

  if (req.method === 'DELETE') {
    uitchecken.laatLos(naam, ik);
    return stuur(res, 200, '{"ok":true}');
  }

  stuur(res, 405, '{"fout":"Niet toegestaan."}');
}

function website(res, adres) {
  const gevraagd = adres.pathname === '/' ? '/teamportaal.html' : decodeURIComponent(adres.pathname);
  const bestand = path.join(WEBSITE, path.normalize(gevraagd));
  if (!bestand.startsWith(WEBSITE + path.sep) || !fs.existsSync(bestand) || fs.statSync(bestand).isDirectory()) {
    return stuur(res, 404, 'Niet gevonden', 'text/plain; charset=utf-8');
  }
  stuur(res, 200, fs.readFileSync(bestand), SOORTEN[path.extname(bestand).toLowerCase()] || 'application/octet-stream');
}

const server = http.createServer(async (req, res) => {
  try {
    const adres = new URL(req.url, 'http://localhost');
    if (adres.pathname === '/health') stuur(res, 200, '{"ok":true}'); // de host vraagt dit om te zien of de server leeft
    else if (adres.pathname === '/api/gegevens' || adres.pathname.startsWith('/api/gegevens/')) await gegevens(req, res, adres);
    else if (adres.pathname.startsWith('/api/uitchecken/')) await uitcheck(req, res, adres);
    else if (/^\/api\/(gebruikers|vakgroepen|rechten)(\/|$)/.test(adres.pathname)) {
      const ik = await aanmelding.gebruikerVan(req);
      if (!ik) stuur(res, 401, '{"fout":"Niet aangemeld."}');
      else await gebruikers.behandel(req, res, adres, ik);
    } else if (adres.pathname === '/api/mijn_vakgroepen_resultaten') {
      const ik = await aanmelding.gebruikerVan(req);
      if (!ik) stuur(res, 401, '{"fout":"Niet aangemeld."}');
      else await mijnVakgroepenResultaten.behandel(req, res, ik);
    } else if (adres.pathname.startsWith('/api/')) await aanmelding.behandel(req, res, adres);
    else website(res, adres);
  } catch (fout) {
    console.error(fout);
    stuur(res, 500, '{"fout":"Serverfout."}');
  }
});

server.on('error', (fout) => {
  if (fout.code === 'EADDRINUSE') console.error(`Poort ${POORT} is al in gebruik: draait het teamportaal misschien al in een ander venster?`);
  else console.error(fout);
  process.exit(1);
});

// Standaard alleen bereikbaar vanaf deze computer (127.0.0.1); online zet de host HOST=0.0.0.0.
server.listen(POORT, ADRES, () => {
  console.log(`TISP Teamportaal draait op http://localhost:${POORT}`);
  console.log(`Gegevens worden bewaard in ${GEGEVENS_MAP}`);
  console.log('Sluit dit venster om de server te stoppen.');
});
