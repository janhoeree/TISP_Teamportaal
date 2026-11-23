/* ===== OPSLAG =====
   De enige plek waar apps gegevens bewaren en laden.
   Nu praat dit bestand met de lokale server (server/server.js), die alles in de map gegevens/ zet.
   Gaat het portaal online, dan pas je alleen dit bestand aan; de apps zelf blijven hetzelfde.

   Gebruik in een app:
     await Opslag.bewaar('vakgroep-wiskunde', gegevens);
     const gegevens = await Opslag.laad('vakgroep-wiskunde');   // null als het nog niet bestaat
     const lijst = await Opslag.lijst('vakgroep-');              // alles waarvan de naam zo begint
     const namen = await Opslag.laadMijnVakgroepenResultaten();  // 'Mijn vakgroepen' van de pagina Resultaten
     await Opslag.bewaarMijnVakgroepenResultaten(namen);
   Lukt het niet (bv. server niet gestart), dan geeft de opdracht een fout.

   Samen aan hetzelfde werken (zie server/uitchecken.js): één collega bewerkt, de anderen kijken mee.
     await Opslag.bewaar(naam, gegevens, true);   // true = weiger als iemand anders intussen iets bewaarde
     const t = await Opslag.toestand(naam);       // { door: 'Lien Leraar' of '', nieuw: true als er een nieuwere versie is }
                                                  // bij een vakgroep ook onderhoud (Vakgroepkompas offline) en onderdelenNieuw
     const u = await Opslag.neem(naam);           // checkt uit: { ok: true }, of { ok: false, door } als het niet kan
     await Opslag.neem(naam, false);              // idem, maar ook als je niet de laatste versie geladen hebt
     Opslag.laatLos(naam);                        // geeft weer vrij
   Weigert de server een bewaring om die reden, dan heeft de fout .bezet = true: laad dan opnieuw. */
const Opslag = (() => {
  const ADRES = '/api/gegevens/';
  const UITCHECKEN = '/api/uitchecken/';
  const ONDERDELEN = 'vakgroepcompas-onderdelen';
  const versies = {}; // per naam: de versie die deze pagina het laatst laadde of bewaarde
  const metVersie = (naam) => (naam in versies ? '?versie=' + versies[naam] : '');
  async function antwoord(r) {
    if (r.status === 409) throw Object.assign(new Error('Intussen door iemand anders aangepast'), { bezet: true });
    if (r.status === 401 || r.status === 403) throw new Error('Geen toegang tot deze gegevens (' + r.status + ')');
    if (!r.ok) throw new Error('Opslag niet bereikbaar (' + r.status + ')');
    return r.json();
  }
  return {
    async laad(naam) {
      const r = await fetch(ADRES + encodeURIComponent(naam), { cache: 'no-store' });
      const gegevens = await antwoord(r);
      versies[naam] = r.headers.get('X-Versie') || '';
      return gegevens;
    },
    async bewaar(naam, gegevens, bewaakt) {
      const uitkomst = await antwoord(await fetch(ADRES + encodeURIComponent(naam) + (bewaakt ? metVersie(naam) : ''), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gegevens),
      }));
      versies[naam] = uitkomst.versie;
    },
    async toestand(naam) {
      const t = await antwoord(await fetch(UITCHECKEN + encodeURIComponent(naam), { cache: 'no-store' }));
      return {
        door: t.door,
        nieuw: naam in versies && t.versie !== versies[naam],
        onderhoud: !!t.onderhoud,
        onderdelenNieuw: 'onderdelen' in t && ONDERDELEN in versies && t.onderdelen !== versies[ONDERDELEN],
      };
    },
    async neem(naam, bewaakt = true) {
      const r = await fetch(UITCHECKEN + encodeURIComponent(naam) + (bewaakt ? metVersie(naam) : ''), { method: 'POST' });
      if (r.status === 409) {
        const { door, vakgroep } = await r.json();
        return { ok: false, door: door || '', vakgroep: vakgroep || '' };
      }
      await antwoord(r);
      return { ok: true };
    },
    laatLos(naam) {
      // keepalive: het verzoek vertrekt ook nog als de pagina net gesloten wordt
      return fetch(UITCHECKEN + encodeURIComponent(naam), { method: 'DELETE', keepalive: true }).catch(() => {});
    },
    async lijst(begin) {
      return antwoord(await fetch(ADRES + '?begin=' + encodeURIComponent(begin), { cache: 'no-store' }));
    },
    async laadMijnVakgroepenResultaten() {
      return antwoord(await fetch('/api/mijn_vakgroepen_resultaten', { cache: 'no-store' }));
    },
    async bewaarMijnVakgroepenResultaten(namen) {
      await antwoord(await fetch('/api/mijn_vakgroepen_resultaten', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(namen),
      }));
    },
  };
})();
