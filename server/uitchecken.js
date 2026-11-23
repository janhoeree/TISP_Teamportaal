// Uitchecken: wie een bestand aan het bewerken is, houdt het even voor zich. Anderen kunnen het dan
// lezen, maar niet bewaren. Zo overschrijven twee collega's elkaars werk niet.
// Een uitcheck vervalt vanzelf na DUUR zonder nieuw teken van leven (bv. laptop dichtgeklapt).
//
// De uitchecks staan in het geheugen van deze ene server: na een herstart is alles weer vrij.
// Draaien er meerdere servers naast elkaar, bewaar ze dan op een gedeelde plek (bv. de databank).
const crypto = require('node:crypto');

const DUUR = 60 * 1000;
const uitgecheckt = new Map(); // naam van het bestand → { id, naam, tot, klaar }

// Onderhoud: wie de onderdelen van het Vakgroepkompas uitcheckt, haalt het hele Vakgroepkompas offline.
//  - Dat lukt alleen als geen collega een vakgroep (vakgroep-…) heeft uitgecheckt.
//  - Zolang het duurt, kan niemand anders een vakgroep uitchecken of bewaren.
//  - Het vervalt na ONDERHOUD_DUUR zonder teken van leven. Geeft de beheerder zelf vrij, dan blijft alles nog
//    BUFFER vast (klaar = true), zodat elke open pagina eerst de nieuwe onderdelen kan laden.
const ONDERHOUD = 'vakgroepcompas-onderdelen';
const ONDERHOUD_DUUR = 10 * 60 * 1000;
const BUFFER = 10 * 1000;
const isVakgroep = (naam) => naam.startsWith('vakgroep-');

function houder(naam) {
  const u = uitgecheckt.get(naam);
  if (u && u.tot < Date.now()) uitgecheckt.delete(naam);
  return uitgecheckt.get(naam) || null;
}

// Wie houdt dit bestand nu tegen voor jou? null als het vrij is of van jezelf, anders
// { naam: de collega, onderhoud: true als het Vakgroepkompas offline is, bestand: de vakgroep waarin iemand bezig is }.
function bezet(naam, ik) {
  const u = houder(naam);
  if (u && (u.id !== ik.id || (u.klaar && naam !== ONDERHOUD))) return { naam: u.naam };
  if (isVakgroep(naam)) {
    const o = houder(ONDERHOUD);
    if (o && (o.id !== ik.id || o.klaar)) return { naam: o.naam, onderhoud: true };
  }
  if (naam === ONDERHOUD) {
    for (const bestand of uitgecheckt.keys()) {
      const v = isVakgroep(bestand) && houder(bestand);
      if (v && v.id !== ik.id) return { naam: v.naam, bestand };
    }
  }
  return null;
}

// De naam van de collega die dit bestand nu tegenhoudt, of '' als het vrij is of van jezelf.
const door = (naam, ik) => (bezet(naam, ik) || { naam: '' }).naam;

function isVan(naam, ik) {
  const u = houder(naam);
  return !!u && u.id === ik.id && !u.klaar;
}

// Checkt uit (of verlengt). Roep dit alleen aan als door() leeg is.
function neem(naam, ik) {
  uitgecheckt.set(naam, { id: ik.id, naam: ik.naam, tot: Date.now() + (naam === ONDERHOUD ? ONDERHOUD_DUUR : DUUR) });
}

function laatLos(naam, ik) {
  if (!isVan(naam, ik)) return;
  if (naam === ONDERHOUD) Object.assign(uitgecheckt.get(naam), { klaar: true, tot: Date.now() + BUFFER });
  else uitgecheckt.delete(naam);
}

// De versie van een inhoud: een korte code die verandert zodra de inhoud verandert ('' = nog niets bewaard).
// Hiermee ziet de server of de browser nog de laatst bewaarde inhoud voor zich heeft.
function versie(inhoud) {
  return inhoud == null ? '' : crypto.createHash('sha1').update(JSON.stringify(inhoud)).digest('hex').slice(0, 16);
}

module.exports = { ONDERHOUD, bezet, door, isVan, neem, laatLos, versie };
