// Opslag: de enige plek waar de server gegevens leest en bewaart.
// Elk stuk gegevens heeft een naam (bv. "vakgroep-wiskunde", "gebruikers") en is gewone JSON.
// Nu wordt elke naam een bestand <naam>.json in de map GEGEVENS_MAP (zie instellingen.js).
//
// Naar een databank? Herschrijf dan alleen de drie functies hieronder (bv. één tabel met de kolommen
// naam en inhoud). De rest van de server gebruikt enkel deze drie en wacht er al op met await.
//
//   await opslag.lees('vakgroep-wiskunde')            → de inhoud, of null als die naam nog niet bestaat
//   await opslag.schrijf('vakgroep-wiskunde', inhoud) → bewaart de inhoud onder die naam (vervangt wat er stond)
//   await opslag.lijst('vakgroep-')                   → alle namen die zo beginnen, bv. ["vakgroep-frans", "vakgroep-wiskunde"]
const fs = require('node:fs/promises');
const path = require('node:path');
const { GEGEVENS_MAP } = require('./instellingen');

const bestand = (naam) => path.join(GEGEVENS_MAP, `${naam}.json`);

async function lees(naam) {
  let tekst;
  try {
    tekst = await fs.readFile(bestand(naam), 'utf8');
  } catch (fout) {
    if (fout.code === 'ENOENT') return null;
    throw fout;
  }
  return JSON.parse(tekst);
}

async function schrijf(naam, inhoud) {
  await fs.mkdir(GEGEVENS_MAP, { recursive: true });
  await fs.writeFile(bestand(naam), `${JSON.stringify(inhoud, null, 2)}\n`, 'utf8');
}

async function lijst(begin = '') {
  await fs.mkdir(GEGEVENS_MAP, { recursive: true });
  return (await fs.readdir(GEGEVENS_MAP))
    .filter((b) => b.startsWith(begin) && b.endsWith('.json'))
    .map((b) => b.slice(0, -'.json'.length));
}

module.exports = { lees, schrijf, lijst };
