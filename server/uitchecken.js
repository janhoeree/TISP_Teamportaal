// Uitchecken: wie een bestand aan het bewerken is, houdt het even voor zich. Anderen kunnen het dan
// lezen, maar niet bewaren. Zo overschrijven twee collega's elkaars werk niet.
// Een uitcheck vervalt vanzelf na DUUR zonder nieuw teken van leven (bv. laptop dichtgeklapt).
//
// De uitchecks staan in het geheugen van deze ene server: na een herstart is alles weer vrij.
// Draaien er meerdere servers naast elkaar, bewaar ze dan op een gedeelde plek (bv. de databank).
const crypto = require('node:crypto');

const DUUR = 60 * 1000;
const uitgecheckt = new Map(); // naam van het bestand → { id, naam, tot }

function houder(naam) {
  const u = uitgecheckt.get(naam);
  if (u && u.tot < Date.now()) uitgecheckt.delete(naam);
  return uitgecheckt.get(naam) || null;
}

// De naam van de collega die dit bestand nu bewerkt, of '' als het vrij is of van jezelf.
function door(naam, ik) {
  const u = houder(naam);
  return u && u.id !== ik.id ? u.naam : '';
}

const isVan = (naam, ik) => (houder(naam) || {}).id === ik.id;

// Checkt uit (of verlengt). Roep dit alleen aan als door() leeg is.
function neem(naam, ik) {
  uitgecheckt.set(naam, { id: ik.id, naam: ik.naam, tot: Date.now() + DUUR });
}

function laatLos(naam, ik) {
  if (isVan(naam, ik)) uitgecheckt.delete(naam);
}

// De versie van een inhoud: een korte code die verandert zodra de inhoud verandert ('' = nog niets bewaard).
// Hiermee ziet de server of de browser nog de laatst bewaarde inhoud voor zich heeft.
function versie(inhoud) {
  return inhoud == null ? '' : crypto.createHash('sha1').update(JSON.stringify(inhoud)).digest('hex').slice(0, 16);
}

module.exports = { door, isVan, neem, laatLos, versie };
