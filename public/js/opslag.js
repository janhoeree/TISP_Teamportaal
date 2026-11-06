/* ===== OPSLAG =====
   De enige plek waar apps gegevens bewaren en laden.
   Nu praat dit bestand met de lokale server (server/server.js), die alles in de map gegevens/ zet.
   Gaat het portaal online, dan pas je alleen dit bestand aan; de apps zelf blijven hetzelfde.

   Gebruik in een app:
     await Opslag.bewaar('vakgroep-wiskunde', gegevens);
     const gegevens = await Opslag.laad('vakgroep-wiskunde');   // null als het nog niet bestaat
     const lijst = await Opslag.lijst('vakgroep-');              // alles waarvan de naam zo begint
   Lukt het niet (bv. server niet gestart), dan geeft de opdracht een fout. */
const Opslag = (() => {
  const ADRES = '/api/gegevens/';
  async function antwoord(r) {
    if (!r.ok) throw new Error('Opslag niet bereikbaar (' + r.status + ')');
    return r.json();
  }
  return {
    async laad(naam) {
      return antwoord(await fetch(ADRES + encodeURIComponent(naam), { cache: 'no-store' }));
    },
    async bewaar(naam, gegevens) {
      await antwoord(await fetch(ADRES + encodeURIComponent(naam), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gegevens),
      }));
    },
    async lijst(begin) {
      return antwoord(await fetch(ADRES + '?begin=' + encodeURIComponent(begin), { cache: 'no-store' }));
    },
  };
})();
