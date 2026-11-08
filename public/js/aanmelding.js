/* ===== AANMELDING =====
   Elke pagina die dit script laadt, is beschermd: wie niet aangemeld is, gaat naar de loginpagina.
   Bovenaan de pagina verschijnt wie er aangemeld is, met een knop "Afmelden".
   De server onthoudt wie je bent (sessiecookie); deze pagina vraagt het gewoon aan de server.

   Gebruik in een app:
     const ik = await Aanmelding.klaar;               // { id, naam, rol, rolNaam, rechten, vakgroepen } of null zonder server
     if (Aanmelding.mag('directie-overzicht')) { ... } // rechten: server/rechten.json (catalogus), per rol in rollen.json,
                                                      // per persoon bijgesteld in gegevens/gebruikers.json (extra/zonder)
     if (Aanmelding.magVakgroep('Wiskunde')) { ... }  // hoort die vakgroep bij mij (of mag ik alle vakgroepen)?
     if (Aanmelding.magVakgroep('Wiskunde', true))    // … en ben ik er vakgroephoofd van?
   De server controleert dezelfde rechten nog eens bij elke vraag; mag() dient om de pagina juist te tonen.
   Mag niet iedereen de pagina zien, zet dan het nodige recht op de scriptregel:
     <script src="../js/aanmelding.js" data-recht="ontwikkelaarsinfo"></script>
   Wie dat recht niet heeft, ziet "Geen toegang" en de app zelf start niet. */
const Aanmelding = (() => {
  let ik = null;
  const paginaRecht = document.currentScript && document.currentScript.dataset.recht;
  const pagina = document.documentElement;
  pagina.style.visibility = 'hidden'; // niets tonen tot we weten wie er aangemeld is

  const domKlaar = () => new Promise((klaar) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', klaar);
    else klaar();
  });

  function toonBalk(tekst, metKnop) {
    const balk = document.createElement('div');
    balk.setAttribute('style', 'display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:6px 16px;'
      + 'font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#586478;background:#fff;border-bottom:1px solid #D6DDD5');
    const t = document.createElement('span');
    t.textContent = tekst;
    balk.append(t);
    if (metKnop) {
      const knop = document.createElement('button');
      knop.type = 'button';
      knop.textContent = 'Afmelden';
      knop.setAttribute('style', 'font:inherit;font-weight:600;color:#147D79;background:none;border:1px solid #D6DDD5;border-radius:99px;padding:2px 12px;cursor:pointer');
      knop.addEventListener('click', afmelden);
      balk.append(knop);
    }
    document.body.prepend(balk);
  }

  const mag = (recht) => !!ik && ik.rechten.includes(recht);
  const slug = (n) => String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const magVakgroep = (vakgroep, hoofd = false) => !!ik && ((!hoofd && mag('alle-vakgroepen'))
    || ik.vakgroepen.some((v) => slug(v.naam) === slug(vakgroep) && (!hoofd || v.hoofd)));

  function toonGeenToegang() {
    for (const el of document.body.children) el.style.display = 'none'; // de app blijft verborgen
    document.body.insertAdjacentHTML('beforeend', '<div style="max-width:640px;margin:48px auto;padding:20px;background:#fff;border:1px solid #D6DDD5;'
      + 'border-top:5px solid #E94627;border-radius:12px;font:16px/1.5 system-ui,-apple-system,\'Segoe UI\',Roboto,sans-serif;color:#1B2A41">'
      + '<h1 style="margin:0 0 8px;font-size:24px">Geen toegang</h1><p style="margin:0 0 12px;color:#586478">Je hebt geen rechten voor deze pagina.</p>'
      + '<a href="/teamportaal.html" style="color:#147D79;font-weight:600">← Terug naar het teamportaal</a></div>');
  }

  async function afmelden() {
    try { await fetch('/api/afmelden', { method: 'POST' }); } catch (e) {}
    location.href = '/login.html';
  }

  const klaar = (async () => {
    try {
      const r = await fetch('/api/ik', { cache: 'no-store' });
      if (!r.ok) throw new Error('Server antwoordt niet');
      ik = await r.json();
    } catch (e) {
      await domKlaar();
      toonBalk('Niet aangemeld: de server draait niet. Start het portaal met start.bat.', false);
      pagina.style.visibility = '';
      return null;
    }
    if (!ik) {
      location.replace('/login.html?terug=' + encodeURIComponent(location.pathname + location.search + location.hash));
      return new Promise(() => {}); // de pagina wordt verlaten
    }
    await domKlaar();
    const toegang = !paginaRecht || mag(paginaRecht);
    if (!toegang) toonGeenToegang();
    toonBalk('Aangemeld als ' + ik.naam + ' (' + ik.rolNaam + ')', true);
    pagina.style.visibility = '';
    return toegang ? ik : new Promise(() => {}); // zonder toegang start de app niet
  })();

  return {
    klaar,
    mag,
    magVakgroep,
    afmelden,
  };
})();
