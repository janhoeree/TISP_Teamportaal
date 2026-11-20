// Instellingen: alles wat verschilt tussen je eigen pc en een online host.
// De host geeft ze mee als omgevingsvariabelen. Op je eigen pc hoef je niets te doen: dan gelden de
// standaardwaarden hieronder. Wil je er toch een wijzigen, kopieer dan .env.example naar .env.
//
//   PORT           poort van de server                                  (standaard 8000)
//   HOST           op welk adres de server luistert                     (standaard 127.0.0.1 = alleen deze computer;
//                  online: 0.0.0.0 = bereikbaar vanaf het netwerk)
//   GEGEVENS_MAP   map waarin server/opslag.js de gegevens bewaart      (standaard de map gegevens/ naast server/)
const fs = require('node:fs');
const path = require('node:path');

const ENV = path.join(__dirname, '..', '.env');
if (fs.existsSync(ENV)) process.loadEnvFile(ENV);

module.exports = {
  POORT: Number(process.env.PORT) || 8000,
  ADRES: process.env.HOST || '127.0.0.1',
  GEGEVENS_MAP: path.resolve(process.env.GEGEVENS_MAP || path.join(__dirname, '..', 'gegevens')),
};
