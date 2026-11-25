/* ===== HELPFUNCTIES =====
   Kleine functies die meerdere apps gebruiken.
     esc(tekst)         maakt tekst veilig om in HTML te zetten (< > & " worden gewone tekens)
     uitlegHtml(tekst)  maakt van een langere uitleg opgemaakte HTML:
                          - elke regel wordt een alinea
                          - een regel die met "- " begint, wordt een opsomming
                          - een webadres (https://…) wordt klikbaar
                          - [tekst](https://…) wordt een link met eigen tekst
   Alleen http- en https-adressen worden een link. */
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* Eén zoekpatroon voor beide vormen, zodat een adres dat al een link werd niet nog eens omgezet wordt. */
const link=t=>esc(t).replace(/\[([^\]]+)\]\((https?:\/\/[^\s<)]+)\)|https?:\/\/[^\s<]+[^\s<.,;:)]/g,
 (m,tekst,adres)=>`<a href="${adres||m}" target="_blank" rel="noopener">${tekst||m}</a>`);
function uitlegHtml(t){let h='',ul=false;
 for(const r of String(t).split('\n').map(x=>x.trim()).filter(Boolean)){const li=r.startsWith('- ');
  if(li!=ul){h+=li?'<ul>':'</ul>';ul=li}h+=li?`<li>${link(r.slice(2))}</li>`:`<p>${link(r)}</p>`}
 return h+(ul?'</ul>':'')}
