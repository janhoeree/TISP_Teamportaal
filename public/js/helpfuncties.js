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
/* Eén zoekpatroon voor beide vormen, zodat een adres dat al een link werd niet nog eens omgezet wordt.
   Er wordt gezocht in de gewone tekst en pas daarna wordt elk stukje veilig gemaakt,
   zodat een afsluitend " of > (bv. "https://…" of <https://…>) niet bij het adres hoort. */
const LINK=/\[([^\]]+)\]\((https?:\/\/[^\s<>")]+)\)|https?:\/\/[^\s<>"]+[^\s<>".,;:)]/g;
function link(t){t=String(t);let h='',i=0;
 for(const m of t.matchAll(LINK)){
  h+=esc(t.slice(i,m.index))+`<a href="${esc(m[2]||m[0])}" target="_blank" rel="noopener">${esc(m[1]||m[0])}</a>`;i=m.index+m[0].length}
 return h+esc(t.slice(i))}
function uitlegHtml(t){let h='',ul=false;
 for(const r of String(t).split('\n').map(x=>x.trim()).filter(Boolean)){const li=r.startsWith('- ');
  if(li!=ul){h+=li?'<ul>':'</ul>';ul=li}h+=li?`<li>${link(r.slice(2))}</li>`:`<p>${link(r)}</p>`}
 return h+(ul?'</ul>':'')}
