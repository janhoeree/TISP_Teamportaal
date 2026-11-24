// Rechten: de ene plek waar de server beslist wat iemand mag.
//
//   rechten van zijn rol (rollen.json)  +  extra  −  zonder  →  concrete lijst, bv. ["vakgroepwerking", "gok", …]
//
// rechten.json is de catalogus: elk recht dat bestaat, met uitleg. "alles" in rollen.json betekent: alle rechten
// uit die catalogus. Wie vakgroephoofd is van minstens één vakgroep, krijgt er vanzelf "vakgroep-koppelen" bij.
// De browser krijgt die lijst via /api/ik en vraagt dan gewoon Aanmelding.mag('…'); de server controleert
// hetzelfde nog eens bij elke vraag, zodat een verborgen tegel nooit de enige beveiliging is.
const RECHTEN = require('./rechten.json');
const ROLLEN = require('./rollen.json');

const slug = (n) => String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function rechtenVan(gebruiker) {
  const rol = ROLLEN[gebruiker.rol] || { rechten: [] };
  const lijst = new Set(rol.rechten === 'alles'
    ? Object.keys(RECHTEN).filter((r) => !(rol.behalve || []).includes(r))
    : rol.rechten);
  for (const r of gebruiker.extra || []) lijst.add(r);
  if ((gebruiker.vakgroepen || []).some((v) => v.hoofd)) lijst.add('vakgroep-koppelen');
  for (const r of gebruiker.zonder || []) lijst.delete(r);
  return [...lijst];
}

const heeft = (gebruiker, recht) => rechtenVan(gebruiker).includes(recht);

// Hoort deze vakgroep bij de gebruiker? Met hoofd=true: is hij er ook vakgroephoofd van?
// Vergelijkt op de slug, zodat "Wiskunde" en het bestand vakgroep-wiskunde bij elkaar horen.
function vanVakgroep(gebruiker, vakgroep, hoofd = false) {
  const s = slug(vakgroep);
  return (gebruiker.vakgroepen || []).some((v) => slug(v.naam) === s && (!hoofd || v.hoofd));
}

// Wie de resultaten of de instellingen van het Vakgroepkompas mag zien, leest alle vakgroepen (maar bewaart ze niet).
const LEZEN_ALLE = ['alle-vakgroepen', 'directie-overzicht', 'vakgroepcompas-config'];
const leestAlleVakgroepen = (gebruiker) => LEZEN_ALLE.some((r) => heeft(gebruiker, r));

// Mag deze gebruiker dit bestand in gegevens/ lezen (methode GET) of bewaren (PUT)?
//  - vakgroep-…            : bewaren alleen voor je eigen vakgroepen; lezen ook alle andere als je
//                            "alle-vakgroepen", "directie-overzicht" of "vakgroepcompas-config" hebt
//  - vakgroepcompas-onderdelen, vakgroepcompas-deadlines: iedereen mag lezen, bewaren vraagt "vakgroepcompas-config"
//  - gebruikers, vakgroepen: nooit via /api/gegevens; daarvoor bestaan /api/gebruikers en /api/vakgroepen
//  - mijn_vakgroepen_resultaten: nooit via /api/gegevens; daarvoor bestaat /api/mijn_vakgroepen_resultaten
//  - al de rest            : iedereen die aangemeld is
function magBestand(gebruiker, naam, methode) {
  if (naam === 'gebruikers' || naam === 'vakgroepen' || naam === 'mijn_vakgroepen_resultaten') return false;
  if (naam.startsWith('vakgroep-')) return vanVakgroep(gebruiker, naam.slice('vakgroep-'.length)) || (methode === 'GET' && leestAlleVakgroepen(gebruiker));
  if (naam === 'vakgroepcompas-onderdelen' || naam === 'vakgroepcompas-deadlines') return methode === 'GET' || heeft(gebruiker, 'vakgroepcompas-config');
  return true;
}

module.exports = { RECHTEN, ROLLEN, LEZEN_ALLE, slug, rechtenVan, heeft, vanVakgroep, leestAlleVakgroepen, magBestand };
