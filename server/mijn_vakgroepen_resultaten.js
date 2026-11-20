// "Mijn vakgroepen" van de pagina Resultaten (apps/vakgroepcompas_resultaten.html):
// welke vakgroepen elke gebruiker daar wil volgen. Wordt enkel voor die pagina gebruikt.
//
//   opslag 'mijn_vakgroepen_resultaten'   { "directie": ["Frans", "Wiskunde"], … }   gebruiker-id → vakgroepnamen
//
// GET /api/mijn_vakgroepen_resultaten → je eigen lijst, bv. ["Frans", "Wiskunde"]
// PUT /api/mijn_vakgroepen_resultaten → bewaart je eigen lijst
// Iedereen leest en bewaart alleen zijn eigen lijst, en enkel met het recht "directie-overzicht".
// Later in een databank wordt dit één tabel: mijn_vakgroepen_resultaten (gebruiker, vakgroep).
const opslag = require('./opslag');
const { stuur, leesJson } = require('./hulp');
const { heeft } = require('./rechten');

const NAAM = 'mijn_vakgroepen_resultaten';
const lees = async () => (await opslag.lees(NAAM)) || {};

async function behandel(req, res, ik) {
  if (!heeft(ik, 'directie-overzicht')) return stuur(res, 403, '{"fout":"Geen toegang."}');
  if (req.method === 'GET') return stuur(res, 200, JSON.stringify((await lees())[ik.id] || []));
  if (req.method === 'PUT') {
    const namen = await leesJson(req);
    if (!Array.isArray(namen) || namen.some((n) => typeof n !== 'string')) return stuur(res, 400, '{"fout":"Verwacht een lijst met vakgroepnamen."}');
    await opslag.wijzig(NAAM, (alles) => ({ ...alles, [ik.id]: [...new Set(namen.map((n) => n.trim()).filter(Boolean))] }));
    return stuur(res, 200, '{"ok":true}');
  }
  stuur(res, 405, '{"fout":"Niet toegestaan."}');
}

module.exports = { behandel };
