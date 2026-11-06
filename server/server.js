// Lokale server van het TISP Teamportaal.
// Doet maar 3 dingen:
//  1. de website in public/ tonen in de browser;
//  2. bijhouden wie er aangemeld is (zie aanmelding.js);
//  3. gegevens bewaren en teruggeven als JSON-bestanden in de map gegevens/.
// De server weet niets over de apps zelf: elke app bewaart gewoon "een bestand met een naam".
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const aanmelding = require('./aanmelding');
const { stuur, leesJson } = require('./hulp');

const POORT = 8000;
const WEBSITE = path.join(__dirname, '..', 'public');
const GEGEVENS = path.join(__dirname, '..', 'gegevens');
const SOORTEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

fs.mkdirSync(GEGEVENS, { recursive: true });

// GET  /api/gegevens?begin=vakgroep-   → lijst van alle bestanden die zo beginnen
// GET  /api/gegevens/vakgroep-wiskunde → inhoud van gegevens/vakgroep-wiskunde.json (null als het nog niet bestaat)
// PUT  /api/gegevens/vakgroep-wiskunde → bewaart de meegestuurde JSON in dat bestand
// Alleen wie aangemeld is, mag gegevens lezen of bewaren.
async function gegevens(req, res, adres) {
  if (!aanmelding.gebruikerVan(req)) return stuur(res, 401, '{"fout":"Niet aangemeld."}');
  const naam = adres.pathname.slice('/api/gegevens/'.length);

  if (!naam && req.method === 'GET') {
    const begin = adres.searchParams.get('begin') || '';
    const lijst = [];
    for (const bestand of fs.readdirSync(GEGEVENS)) {
      if (!bestand.startsWith(begin) || !bestand.endsWith('.json')) continue;
      try {
        lijst.push(JSON.parse(fs.readFileSync(path.join(GEGEVENS, bestand), 'utf8')));
      } catch {
        console.warn(`Overgeslagen (geen geldige JSON): gegevens/${bestand}`);
      }
    }
    return stuur(res, 200, JSON.stringify(lijst));
  }

  if (!/^[a-z0-9-]+$/.test(naam)) return stuur(res, 400, '{"fout":"Ongeldige naam."}');
  const bestand = path.join(GEGEVENS, `${naam}.json`);

  if (req.method === 'GET') {
    if (!fs.existsSync(bestand)) return stuur(res, 200, 'null'); // bestaat nog niet
    return stuur(res, 200, fs.readFileSync(bestand));
  }

  if (req.method === 'PUT') {
    const inhoud = await leesJson(req);
    if (inhoud === undefined) return stuur(res, 400, '{"fout":"Geen geldige JSON."}');
    fs.writeFileSync(bestand, `${JSON.stringify(inhoud, null, 2)}\n`, 'utf8');
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
    if (adres.pathname === '/api/gegevens' || adres.pathname.startsWith('/api/gegevens/')) await gegevens(req, res, adres);
    else if (adres.pathname.startsWith('/api/')) await aanmelding.behandel(req, res, adres);
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

// Alleen bereikbaar vanaf deze computer (127.0.0.1), niet vanaf het netwerk.
server.listen(POORT, '127.0.0.1', () => {
  console.log(`TISP Teamportaal draait op http://localhost:${POORT}`);
  console.log(`Gegevens worden bewaard in ${GEGEVENS}`);
  console.log('Sluit dit venster om de server te stoppen.');
});
