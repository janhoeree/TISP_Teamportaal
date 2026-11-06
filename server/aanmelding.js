// Aanmelden met testgebruikers.
// Werkt achter de schermen al zoals een echte login: na het aanmelden krijgt de browser een
// sessiecookie, en bij elke vraag kijkt de server aan de hand van die cookie wie je bent.
// Later vervang je enkel aanmelden() door een echte controle (wachtwoord, schoolaccount, ...).
const crypto = require('node:crypto');
const { stuur, leesJson } = require('./hulp');

const GEBRUIKERS = require('./gebruikers.json');
const ROLLEN = require('./rollen.json');
const COOKIE = 'tisp_sessie';
const sessies = new Map(); // sessiecode → gebruiker-id (verdwijnt als de server stopt)

function metRol(gebruiker) {
  const rol = ROLLEN[gebruiker.rol];
  return { id: gebruiker.id, naam: gebruiker.naam, rol: gebruiker.rol, rolNaam: rol.naam, rechten: rol.rechten, behalve: rol.behalve || [] };
}

// De sessiecode uit de cookie die de browser meestuurt.
function sessiecode(req) {
  const koekjes = (req.headers.cookie || '').split(';').map((k) => k.trim().split('='));
  const gevonden = koekjes.find(([naam]) => naam === COOKIE);
  return gevonden ? gevonden[1] : null;
}

// Wie is er aangemeld in deze browser? Geeft null als niemand.
function gebruikerVan(req) {
  const gebruiker = GEBRUIKERS.find((g) => g.id === sessies.get(sessiecode(req)));
  return gebruiker ? metRol(gebruiker) : null;
}

// GET  /api/testgebruikers → de keuzes op de loginpagina
// POST /api/aanmelden      → { "id": "directie" } meldt aan als die testgebruiker
// GET  /api/ik             → wie ben ik? (null als niet aangemeld)
// POST /api/afmelden       → meldt af
async function behandel(req, res, adres) {
  const route = `${req.method} ${adres.pathname}`;

  if (route === 'GET /api/testgebruikers') return stuur(res, 200, JSON.stringify(GEBRUIKERS.map(metRol)));
  if (route === 'GET /api/ik') return stuur(res, 200, JSON.stringify(gebruikerVan(req)));

  if (route === 'POST /api/aanmelden') {
    const vraag = await leesJson(req);
    const gebruiker = GEBRUIKERS.find((g) => g.id === (vraag && vraag.id));
    if (!gebruiker) return stuur(res, 400, '{"fout":"Onbekende gebruiker."}');
    const code = crypto.randomUUID();
    sessies.set(code, gebruiker.id);
    return stuur(res, 200, JSON.stringify(metRol(gebruiker)), undefined, {
      'Set-Cookie': `${COOKIE}=${code}; Path=/; HttpOnly; SameSite=Lax`,
    });
  }

  if (route === 'POST /api/afmelden') {
    sessies.delete(sessiecode(req));
    return stuur(res, 200, '{"ok":true}', undefined, { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` });
  }

  stuur(res, 404, '{"fout":"Niet gevonden."}');
}

module.exports = { behandel, gebruikerVan };
