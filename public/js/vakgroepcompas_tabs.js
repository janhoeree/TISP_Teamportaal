/* ===== TABBLADEN VAN VAKGROEPWERKING =====
   Vakgroepwerking bestaat uit aparte pagina's. Bovenaan elke pagina staan tabbladen naar de andere pagina's.
   Een tabblad is een gewone link: je opent er gewoon de andere html-pagina mee.
   Je ziet alleen de tabbladen waarvoor je het recht hebt. Mag je maar één pagina openen, dan zie je geen tabbladen.
   Elke pagina blijft zelf beschermd met data-recht op aanmelding.js, en de server controleert nog eens.

   Gebruik in een pagina van Vakgroepwerking (na aanmelding.js, met een <div class="card bar"> bovenaan):
     <script src="../js/vakgroepcompas_tabs.js" defer></script>
   Een pagina toevoegen = één regel in PAGINAS. */
const VakgroepwerkingTabs = (() => {
  const PAGINAS = [
    { naam: 'Vakgroepwerking', pagina: 'vakgroepcompas.html', recht: 'vakgroepwerking' },
    { naam: 'Vakgroepbeheer', pagina: 'vakgroepbeheer.html', recht: 'vakgroep-koppelen' },
    { naam: 'Resultaten', pagina: 'vakgroepcompas_resultaten.html', recht: 'directie-overzicht' },
    { naam: 'Instellingen', pagina: 'vakgroepcompas_config.html', recht: 'vakgroepcompas-config' },
  ];
  const rechten = PAGINAS.map((p) => p.recht).join(' '); // het ene óf het andere recht: zo opent de tegel in het teamportaal
  const mijne = () => PAGINAS.filter((p) => Aanmelding.mag(p.recht));

  const STIJL = `
.tabbladen{display:flex;gap:4px;align-items:flex-end;padding:0 0 1px 14px;margin-bottom:-1px;overflow-x:auto;position:relative;z-index:1}
.tabbladen a{flex:none;padding:9px 20px 8px;border:1px solid var(--line);border-bottom:0;border-radius:10px 10px 0 0;
 background:color-mix(in srgb,var(--line) 45%,var(--card));color:var(--mut);text-decoration:none;font-weight:600;white-space:nowrap}
.tabbladen a:hover{color:var(--ink);background:var(--card)}
.tabbladen a.on{--achter:color-mix(in srgb,var(--tealink) 6%,var(--card));background:var(--achter);border-color:var(--tealink);
 border-top:4px solid var(--tealink);color:var(--tealink);padding-top:11px;margin-bottom:-1px}
.card.bar.met-tabbladen{border-top:1px solid var(--tealink)}`;

  function teken() {
    const zichtbaar = mijne();
    const kaart = document.querySelector('.card.bar');
    if (zichtbaar.length < 2 || !kaart) return;
    const hier = location.pathname.split('/').pop();
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    document.head.insertAdjacentHTML('beforeend', '<style>' + STIJL + '</style>');
    kaart.classList.add('met-tabbladen');
    kaart.insertAdjacentHTML('beforebegin', '<div class="tabbladen" role="navigation" aria-label="Vakgroepwerking">'
      + zichtbaar.map((p) => `<a href="${esc(p.pagina)}"${p.pagina === hier ? ' class="on" aria-current="page"' : ''}>${esc(p.naam)}</a>`).join('')
      + '</div>');
  }

  if (location.pathname.includes('/apps/')) Aanmelding.klaar.then((ik) => { if (ik) teken(); });
  return { PAGINAS, rechten, mijne };
})();
