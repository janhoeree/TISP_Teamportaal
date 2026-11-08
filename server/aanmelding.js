// Aanmelden met testgebruikers.
// Werkt achter de schermen al zoals een echte login: na het aanmelden krijgt de browser een
// sessiecookie, en bij elke vraag kijkt de server aan de hand van die cookie wie je bent.
// Later vervang je enkel aanmelden() door een echte controle (wachtwoord, schoolaccount, ...).
const crypto = require('node:crypto');
const { stuur, leesJson } = require('./hulp');

const gebruikers = require('./gebruikers');
const COOKIE = 'tisp_sessie';
const sessies = new Map(); // sessiecode → gebruiker-id (verdwijnt als de server stopt)

// De sessiecode uit de cookie die de browser meestuurt.
function sessiecode(req) {
  const koekjes = (req.headers.cookie || '').split(';').map((k) => k.trim().split('='));
  const gevonden = koekjes.find(([naam]) => naam === COOKIE);
  return gevonden ? gevonden[1] : null;
}

// Wie is er aangemeld in deze browser? Geeft null als niemand.
// Leest de gebruiker telkens opnieuw uit gegevens/gebruikers.json, zodat een nieuwe koppeling of een
// aangepast recht meteen geldt, zonder opnieuw aan te melden.
function gebruikerVan(req) {
  return gebruikers.zoek(sessies.get(sessiecode(req)));
}

// GET  /api/testgebruikers → de keuzes op de loginpagina
// POST /api/aanmelden      → { "id": "directie" } meldt aan als die testgebruiker
// GET  /api/ik             → wie ben ik? { id, naam, rol, rolNaam, rechten, vakgroepen } (null als niet aangemeld)
// POST /api/afmelden       → meldt af
async function behandel(req, res, adres) {
  const route = `${req.method} ${adres.pathname}`;

  if (route === 'GET /api/testgebruikers') return stuur(res, 200, JSON.stringify(gebruikers.alleGebruikers().map(gebruikers.profiel)));
  if (route === 'GET /api/ik') {
    const ik = gebruikerVan(req);
    return stuur(res, 200, JSON.stringify(ik && gebruikers.profiel(ik)));
  }

  if (route === 'POST /api/aanmelden') {
    const vraag = await leesJson(req);
    const gebruiker = gebruikers.zoek(vraag && vraag.id);
    if (!gebruiker) return stuur(res, 400, '{"fout":"Onbekende gebruiker."}');
    const code = crypto.randomUUID();
    sessies.set(code, gebruiker.id);
    return stuur(res, 200, JSON.stringify(gebruikers.profiel(gebruiker)), undefined, {
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
