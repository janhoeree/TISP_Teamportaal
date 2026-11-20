// Opslag: de enige plek waar de server gegevens leest en bewaart.
// Elk stuk gegevens heeft een naam (bv. "vakgroep-wiskunde", "gebruikers") en is gewone JSON.
// Nu wordt elke naam een bestand <naam>.json in de map GEGEVENS_MAP (zie instellingen.js).
//
// Naar een databank? Herschrijf dan alleen de vier functies hieronder (bv. één tabel met de kolommen
// naam en inhoud; wijzig wordt een transactie). De rest van de server gebruikt enkel deze vier en wacht
// er al op met await.
//
//   await opslag.lees('vakgroep-wiskunde')            → de inhoud, of null als die naam nog niet bestaat
//   await opslag.schrijf('vakgroep-wiskunde', inhoud) → bewaart de inhoud onder die naam (vervangt wat er stond)
//   await opslag.wijzig('gebruikers', (oud) => nieuw) → lezen, aanpassen en bewaren als één stap: niemand anders
//                                                       bewaart ertussen. Geeft de functie niets terug, dan
//                                                       wordt er niets bewaard.
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

// Alles wat bewaart, loopt één voor één door deze wachtrij. Zo lopen twee bewaringen nooit door elkaar.
let wachtrij = Promise.resolve();
function naElkaar(taak) {
  const uitkomst = wachtrij.then(taak);
  wachtrij = uitkomst.catch(() => {});
  return uitkomst;
}

async function bewaar(naam, inhoud) {
  await fs.mkdir(GEGEVENS_MAP, { recursive: true });
  await fs.writeFile(bestand(naam), `${JSON.stringify(inhoud, null, 2)}\n`, 'utf8');
}

const schrijf = (naam, inhoud) => naElkaar(() => bewaar(naam, inhoud));

const wijzig = (naam, aanpassing) => naElkaar(async () => {
  const nieuw = await aanpassing(await lees(naam));
  if (nieuw !== undefined) await bewaar(naam, nieuw);
});

async function lijst(begin = '') {
  await fs.mkdir(GEGEVENS_MAP, { recursive: true });
  return (await fs.readdir(GEGEVENS_MAP))
    .filter((b) => b.startsWith(begin) && b.endsWith('.json'))
    .map((b) => b.slice(0, -'.json'.length));
}

module.exports = { lees, schrijf, wijzig, lijst };
