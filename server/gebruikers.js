// Gebruikers en vakgroepen.
//
//   gegevens/gebruikers.json   wie bestaat er: id, naam, rol, vakgroepen (met of zonder hoofd), extra en zonder
//   gegevens/vakgroepen.json   de officiële lijst van vakgroepen, bv. ["Wiskunde", "Frans"]
//
// Bestaan die bestanden nog niet, dan gelden de testgebruikers uit server/gebruikers.json als vertrekpunt
// (en hun vakgroepen als eerste lijst). Later, bij een echte login, wordt een schoolaccount gekoppeld aan
// een id uit gebruikers.json; rol, vakgroepen en tegels blijven dan precies zo werken.
const fs = require('node:fs');
const path = require('node:path');
const { stuur, leesJson } = require('./hulp');
const { RECHTEN, ROLLEN, slug, rechtenVan, heeft, vanVakgroep } = require('./rechten');

const GEGEVENS = path.join(__dirname, '..', 'gegevens');
const BESTAND = { gebruikers: path.join(GEGEVENS, 'gebruikers.json'), vakgroepen: path.join(GEGEVENS, 'vakgroepen.json') };
const START = require('./gebruikers.json');

function lees(welk, anders) {
  try { return JSON.parse(fs.readFileSync(BESTAND[welk], 'utf8')); } catch { return anders(); }
}
function schrijf(welk, inhoud) {
  fs.mkdirSync(GEGEVENS, { recursive: true });
  fs.writeFileSync(BESTAND[welk], `${JSON.stringify(inhoud, null, 2)}\n`, 'utf8');
}

const alleGebruikers = () => lees('gebruikers', () => START).map(schoon);
const alleVakgroepen = () => lees('vakgroepen', () => [...new Set(START.flatMap((g) => (g.vakgroepen || []).map((v) => v.naam)))]);
const zoek = (id) => alleGebruikers().find((g) => g.id === id) || null;

// Zorgt dat elke gebruiker alle velden heeft, ook oudere bestanden zonder vakgroepen/extra/zonder.
function schoon(g) {
  return {
    id: g.id, naam: g.naam, rol: g.rol,
    vakgroepen: (g.vakgroepen || []).map((v) => (v.hoofd ? { naam: v.naam, hoofd: true } : { naam: v.naam })),
    extra: g.extra || [], zonder: g.zonder || [],
  };
}

// Wat de browser te zien krijgt (/api/ik, /api/testgebruikers, /api/gebruikers): de rechten al uitgerekend.
function profiel(g) {
  return { ...g, rolNaam: (ROLLEN[g.rol] || { naam: g.rol }).naam, rechten: rechtenVan(g) };
}

// Past de gevraagde wijziging toe op een gebruiker, binnen wat 'ik' mag:
//  - met gebruikers-beheer: naam, rol, vakgroepen (ook wie hoofd is), extra en zonder
//  - als vakgroephoofd (vakgroep-koppelen): alleen koppelen/loskoppelen voor de vakgroepen waarvan ik hoofd ben;
//    wie daar hoofd is, verandert niet (een hoofd kan hij ook niet loskoppelen), en andere vakgroepen blijven zoals ze waren
// Geeft een foutmelding (tekst) terug als iets niet mag of niet klopt, anders de nieuwe gebruiker.
function pasAan(ik, oud, vraag, vakgroepen) {
  const nieuw = { ...oud };
  const kent = (naam) => vakgroepen.some((v) => v === naam);
  if (vraag.vakgroepen !== undefined) {
    if (!Array.isArray(vraag.vakgroepen) || vraag.vakgroepen.some((v) => !v || typeof v.naam !== 'string')) return 'Vakgroepen moeten een lijst van { naam, hoofd } zijn.';
    if (vraag.vakgroepen.some((v) => !kent(v.naam))) return 'Onbekende vakgroep.';
  }

  if (heeft(ik, 'gebruikers-beheer')) {
    if (typeof vraag.naam === 'string' && vraag.naam.trim()) nieuw.naam = vraag.naam.trim();
    if (vraag.rol !== undefined && vraag.rol !== oud.rol) {
      if (!ROLLEN[vraag.rol]) return 'Onbekende rol.';
      if (ik.id === oud.id) return 'Je kunt je eigen rol niet aanpassen.'; // zo sluit niemand zichzelf buiten
      nieuw.rol = vraag.rol;
    }
    if (vraag.vakgroepen) nieuw.vakgroepen = vraag.vakgroepen.map((v) => (v.hoofd ? { naam: v.naam, hoofd: true } : { naam: v.naam }));
    for (const veld of ['extra', 'zonder']) {
      if (vraag[veld] === undefined) continue;
      if (!Array.isArray(vraag[veld]) || vraag[veld].some((r) => !RECHTEN[r])) return `Onbekend recht bij ${veld}.`;
      nieuw[veld] = [...new Set(vraag[veld])];
    }
    return nieuw;
  }

  if (heeft(ik, 'vakgroep-koppelen') && vraag.vakgroepen) {
    const mijne = (naam) => vanVakgroep(ik, naam, true);
    const behouden = oud.vakgroepen.filter((v) => !mijne(v.naam));
    const gekoppeld = vraag.vakgroepen.filter((v) => mijne(v.naam)).map((v) => {
      const was = oud.vakgroepen.find((o) => o.naam === v.naam);
      return was && was.hoofd ? { naam: v.naam, hoofd: true } : { naam: v.naam };
    });
    const hoofden = oud.vakgroepen.filter((v) => v.hoofd && mijne(v.naam) && !gekoppeld.some((g) => g.naam === v.naam));
    nieuw.vakgroepen = [...behouden, ...gekoppeld, ...hoofden];
    return nieuw;
  }

  return 'Je mag deze gebruiker niet aanpassen.';
}

// Een vakgroephoofd ziet van elke gebruiker enkel naam, rol en de koppelingen met zijn eigen vakgroepen.
function voorHoofd(ik, g) {
  return { id: g.id, naam: g.naam, rol: g.rol, rolNaam: (ROLLEN[g.rol] || { naam: g.rol }).naam,
    vakgroepen: g.vakgroepen.filter((v) => vanVakgroep(ik, v.naam, true)) };
}

// De catalogus en wat elke rol standaard krijgt, zodat gebruikers.html kan tonen wat afwijkt van de rol.
function catalogus() {
  const rollen = {};
  for (const [id, rol] of Object.entries(ROLLEN)) rollen[id] = { naam: rol.naam, rechten: rechtenVan({ rol: id }) };
  return { rechten: RECHTEN, rollen };
}

// GET /api/rechten            → { rechten: de catalogus, rollen: { leraar: { naam, rechten: [...] }, … } }
// GET /api/gebruikers         → alle gebruikers (met gebruikers-beheer volledig, voor vakgroephoofden beperkt)
// PUT /api/gebruikers/<id>    → { naam?, rol?, vakgroepen?, extra?, zonder? }; de server past enkel toe wat jij mag
// GET /api/vakgroepen         → de lijst van vakgroepen (iedereen die aangemeld is)
// PUT /api/vakgroepen         → ["Wiskunde", "Frans", …] (alleen gebruikers-beheer); koppelingen naar een vakgroep
//                               die verdwijnt, worden mee verwijderd
async function behandel(req, res, adres, ik) {
  const route = `${req.method} ${adres.pathname}`;
  const magBeheren = heeft(ik, 'gebruikers-beheer') || heeft(ik, 'vakgroep-koppelen');

  if (route === 'GET /api/rechten') return stuur(res, 200, JSON.stringify(catalogus()));

  if (route === 'GET /api/vakgroepen') return stuur(res, 200, JSON.stringify(alleVakgroepen()));

  if (route === 'PUT /api/vakgroepen') {
    if (!heeft(ik, 'gebruikers-beheer')) return stuur(res, 403, '{"fout":"Geen toegang."}');
    const lijst = await leesJson(req);
    if (!Array.isArray(lijst) || lijst.some((v) => typeof v !== 'string' || !v.trim())) return stuur(res, 400, '{"fout":"Verwacht een lijst van namen."}');
    const namen = [...new Set(lijst.map((v) => v.trim()))];
    if (new Set(namen.map(slug)).size !== namen.length) return stuur(res, 400, '{"fout":"Twee vakgroepen hebben (bijna) dezelfde naam."}');
    schrijf('vakgroepen', namen);
    schrijf('gebruikers', alleGebruikers().map((g) => ({ ...g, vakgroepen: g.vakgroepen.filter((v) => namen.includes(v.naam)) })));
    return stuur(res, 200, JSON.stringify(namen));
  }

  if (route === 'GET /api/gebruikers') {
    if (!magBeheren) return stuur(res, 403, '{"fout":"Geen toegang."}');
    const lijst = alleGebruikers();
    return stuur(res, 200, JSON.stringify(heeft(ik, 'gebruikers-beheer') ? lijst.map(profiel) : lijst.map((g) => voorHoofd(ik, g))));
  }

  if (req.method === 'PUT' && adres.pathname.startsWith('/api/gebruikers/')) {
    if (!magBeheren) return stuur(res, 403, '{"fout":"Geen toegang."}');
    const lijst = alleGebruikers();
    const i = lijst.findIndex((g) => g.id === adres.pathname.slice('/api/gebruikers/'.length));
    if (i < 0) return stuur(res, 404, '{"fout":"Onbekende gebruiker."}');
    const vraag = await leesJson(req);
    if (!vraag || typeof vraag !== 'object') return stuur(res, 400, '{"fout":"Geen geldige JSON."}');
    const uitkomst = pasAan(ik, lijst[i], vraag, alleVakgroepen());
    if (typeof uitkomst === 'string') return stuur(res, 403, JSON.stringify({ fout: uitkomst }));
    lijst[i] = uitkomst;
    schrijf('gebruikers', lijst);
    return stuur(res, 200, JSON.stringify(heeft(ik, 'gebruikers-beheer') ? profiel(uitkomst) : voorHoofd(ik, uitkomst)));
  }

  stuur(res, 404, '{"fout":"Niet gevonden."}');
}

module.exports = { behandel, alleGebruikers, alleVakgroepen, zoek, profiel };
