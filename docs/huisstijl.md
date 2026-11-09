# TISP huisstijl – instructies voor AI bij het bouwen van HTML-pagina's

> Doel van dit bestand: geef het aan een AI (Claude, ChatGPT, ...) samen met je opdracht, zodat nieuwe pagina's er hetzelfde uitzien als het TISP teamportaal (`public/teamportaal.html`).
> Bronbestand: `public/teamportaal.html`. Taal van de interface: **Nederlands (Vlaams)**, `<html lang="nl">`.

## 0. Opdracht aan de AI (kort)

Bouw de gevraagde pagina als **één zelfstandig HTML-bestand** (inline CSS en JS, geen frameworks, geen externe lettertypes of CDN's) in de stijl hieronder. Gebruik altijd de CSS-variabelen uit sectie 1, het systeemlettertype, de tegel- en kaartstijl, en de toegankelijkheidsregels. Alle zichtbare tekst is Nederlands. Verzin geen nieuwe kleuren of lettertypes.

---

## 1. Kleurtokens (verplicht via CSS-variabelen op `:root`)

De kleuren komen rechtstreeks uit het logo (`logo.svg`): teal #10A997, blauw #1B85E0, oranje #E68311, rood-oranje #E94627, groen #9EC222. Enkel `--tealink` is een donkerdere afgeleide van het logo-teal, zodat tekst en randen voldoende contrast hebben.

```css
:root{
  color-scheme:light;
  --bg:#F6F8F7;      /* paginaachtergrond */
  --card:#fff;       /* kaarten / tegels */
  --ink:#1B2A41;     /* hoofdtekst */
  --mut:#586478;     /* secundaire tekst */
  --line:#D6DDD5;    /* randen */
  --teal:#10A997;    /* hoofdaccent (TISP-teal), exact uit het logo */
  --tealink:#147D79; /* donkerder teal voor tekst/links en randen (afgeleid van het logo-teal, voldoende contrast) */
  --g:#9EC222;       /* groen accent */
  --r:#E94627;       /* rood accent */
  --o:#E68311;       /* oranje accent */
  --b:#1B85E0;       /* blauw accent, ook voor focusring */
}
```

Extra vaste kleur: titel in de banner `#0B3B4F` (donker petrol). Verder geen hardcoded kleuren; gebruik de tokens.

**Gebruik van de accenten**
- Accentkleuren (`--teal --g --o --b --r`) worden per tegel/onderdeel gekozen als `--a` en gebruikt voor: dikke bovenrand (5px) en een zachte achtergrondtint van het icoon (`color-mix(in srgb, var(--a) 20%, var(--card))`).
- Tekst in accentkleur: gebruik `--tealink` (niet `--teal`) voor leesbaarheid; `--o` alleen voor korte nadruk (bv. een slotwoord in de ondertitel).
- Rood (`--r`) = probleem/AI-beleid, oranje = actie/idee, groen = gelijke kansen/nieuw, blauw = internationaal/vertrouwen, teal = standaard/visie.
- Pagina is **licht thema**. Er is geen donkere modus (`color-scheme:light`). Voeg er alleen een toe als expliciet gevraagd.

## 2. Typografie

- Lettertype overal: `system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`. **Geen webfonts.**
- Body: `16px/1.5`, kleur `--ink`.
- Paginatitel (h1, in banner): gewicht 800, regelhoogte 1.12, kleur `#0B3B4F`, schaalt mee met de banner (zie sectie 4).
- Ondertitel: kleur `--tealink`, ~64% van de h1-grootte.
- Sectietitel `h2.sec`: `700 clamp(16px, 12px + 1.1vw, 20px)`, `margin:0 0 clamp(10px, 6px + .6vw, 14px)`.
- Tegeltitel `h3`: `700 clamp(15px, 12px + .9vw, 18px)`.
- Tegeltekst: `clamp(13px, 11px + .6vw, 14.5px)`, regelhoogte 1.4, kleur `--mut`.
- Badge-tekst: `clamp(11px, 10px + .3vw, 12px)`, gewicht 600.
- Typografie schaalt vloeiend met `clamp()`; gebruik geen vaste breakpoints voor lettergrootte.

## 3. Algemene layout

```css
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1000px;margin:0 auto;padding:0 16px 56px}
```

- Inhoud staat in `.wrap` (max. 1000px, gecentreerd, 16px zijmarge, 56px onderaan).
- Pagina-opbouw: `<header class="hero">` (volle breedte) → `<div class="wrap"><main>…</main></div>`.
- Viewport: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Safe areas (iPhone-notch) altijd respecteren:
  ```css
  :root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
  html{scroll-padding-top:env(safe-area-inset-top,0px)}
  ```
- Ruimtes: gaps en paddings gebruiken `clamp()` (bv. `clamp(10px,6px + .6vw,14px)`), zodat het op smalle schermen iets compacter wordt.
- Hoekradius: kaarten/tegels `12px`; iconen `12px`; pillen/badges `99px`.
- Schaduw alleen bij hover: `0 8px 20px #0000001f`.

## 4. Banner (hero)

Opbouw (HTML):

```html
<header class="hero"><div class="hero-in">
  <div class="logo" data-afbeelding="logo"></div>
  <div class="txt"><h1>Welkom op het TISP teamportaal</h1><p>Hier bouwen we samen aan <span>de school van morgen.</span></p></div>
  <div class="duo">
    <div class="paul" data-afbeelding="paul"></div>
    <div class="paulien" data-afbeelding="paulien"></div>
  </div>
</div></header>
```

Kernregels CSS:

```css
.hero{container-type:inline-size}
.hero-in{max-width:1700px;margin:0 auto;
  --u:min(1cqw,max(10px,calc(10px + (100cqw - 1000px)*.0015)));
  display:grid;grid-template-columns:minmax(0,1fr) auto;
  grid-template-areas:"logo duo" "text duo";grid-template-rows:auto 1fr;
  column-gap:calc(var(--u)*2);
  padding:calc(var(--u)*1.2) max(calc(var(--u)*1.5),env(safe-area-inset-right)) max(10px,calc(var(--u)*4)) max(calc(var(--u)*2),env(safe-area-inset-left))}
.logo{grid-area:logo;width:calc(var(--u)*32);max-width:100%;aspect-ratio:1684/468;justify-self:start}
.txt{grid-area:text;align-self:center;padding:0 0 calc(var(--u)*2) calc(var(--u)*7.8);text-align:left}
.txt h1{margin:0 0 var(--u);white-space:nowrap;font-weight:800;font-size:calc(var(--u)*3.6*var(--fit,1));line-height:1.12;color:#0B3B4F}
.txt p{margin:0;white-space:nowrap;font-size:calc(var(--u)*2.3*var(--fit,1));color:var(--tealink)}
.txt p span{color:var(--o)}
.duo{grid-area:duo;align-self:start;display:flex;align-items:flex-end;gap:0}
.paul{height:calc(var(--u)*19);aspect-ratio:2909/3619}
.paulien{height:calc(var(--u)*23.8);aspect-ratio:2414/4096;margin-left:calc(var(--u)*-3.5)}
.hero svg,.hero img{display:block;width:100%;height:100%}
```

Principes:
- De banner gebruikt de **volle paginabreedte**; alles erin schaalt met `--u` (1% van de bannerbreedte, via container query units `cqw`). Boven 1000px groeit hij nog maar heel traag (0,15% per extra px), zodat er op brede schermen witruimte ontstaat in plaats van een reusachtige banner.
- Titel en ondertitel staan **altijd op 1 lijn** (`white-space:nowrap`). Een JS-functie `pasTekstAan()` zet `--fit` (< 1) als het lettertype breder uitvalt dan beschikbaar (zie sectie 8).
- Ondertitel: gewone tekst in `--tealink`, met het sleutelwoord/de slotzin in een `<span>` (oranje `--o`).
- Linksboven het logo, rechts de twee figuren (Paul en Paulien, overlappend met negatieve marge), titel en ondertitel links onder het logo, ingesprongen (`7.8 × --u`).
- Voor subpagina's gebruik je de slanke variant uit 4b (zonder logo, ondertitel in 1 kleur) en de kaartstijl uit 4c.

### 4b. Slanke banner voor zijpagina's (`hero slim`)

Het portaal (startpagina) gebruikt de grote banner. **Alle zijpagina's gebruiken de slanke banner**: zelfde HTML en `--u`-schaal, met de klasse `slim` erbij: `<header class="hero slim">`. Op zijpagina's staat **geen logo** (laat het `.logo`-element weg) en heeft de **ondertitel maar één kleur** (`--tealink`, geen oranje `<span>`). Zet de CSS hieronder ná de CSS van de grote banner.

```html
<header class="hero slim"><div class="hero-in">
  <div class="txt"><h1>[Paginatitel]</h1><p>[Ondertitel in één kleur]</p></div>
  <div class="duo">
    <div class="paul" data-afbeelding="paul"></div>
    <div class="paulien" data-afbeelding="paulien"></div>
  </div>
</div></header>
```

```css
.hero.slim .hero-in{max-width:1000px;padding-left:16px;padding-right:16px;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"text duo";grid-template-rows:auto;align-items:center;column-gap:calc(var(--u)*2.5);padding-top:calc(var(--u)*1);padding-bottom:calc(var(--u)*1.2)}
.hero.slim .txt{padding:0}
.hero.slim .txt h1{font-size:calc(var(--u)*3.2*var(--fit,1));margin:0 0 calc(var(--u)*.5)}
.hero.slim .txt p{font-size:calc(var(--u)*1.9*var(--fit,1))}
.hero.slim .duo{align-self:end}
.hero.slim .paul{height:calc(var(--u)*10.5)}
.hero.slim .paulien{height:calc(var(--u)*13);margin-left:calc(var(--u)*-2)}
@container (max-width:640px){
 .hero.slim .paul{height:calc(var(--u)*11)}.hero.slim .paulien{height:calc(var(--u)*14)}
 .hero.slim .txt h1{font-size:calc(var(--u)*4.6*var(--fit,1))}
 .hero.slim .txt p{font-size:calc(var(--u)*3.2*var(--fit,1));white-space:normal}
}
```

- Uitlijning: de inhoud van de slanke banner heeft dezelfde breedte en zijmarges als `.wrap` (max 1000px, 16px zijpadding). Zo staat de titel op dezelfde lijn als de linkerkant van de vakken en eindigen de figuren op dezelfde lijn als de rechterkant.
- Eén rij: titel + ondertitel links, Paul en Paulien (kleiner) rechts. Op smalle schermen (banner <= 640px) blijft dat zo; de ondertitel mag dan over 2 lijnen lopen.
- De titel blijft op 1 lijn; `pasTekstAan()` en de rest van de JS zijn identiek aan de grote banner. Het `logo`-item in `AFBEELDINGEN` mag blijven staan, het wordt dan gewoon niet gebruikt.
- Houd de titel kort (paginanaam) en de ondertitel 1 korte zin.

### 4c. Kaarten en vakken op zijpagina's

Op zijpagina's hebben alle vakken (kaarten, werkbalk, statistiekvakken) **dezelfde randkleur en een lichte vulling**, in plaats van de wisselende accentkleuren van de portaaltegels. De vorm van de rand blijft gelijk aan de tegels: dikke bovenrand van 5px, dunne rand van 1px rondom. Enkel de kleur verandert.

```css
--tint:color-mix(in srgb,var(--tealink) 11%,var(--card));   /* iets sterkere tint voor blokken binnen een kaart */
.card{background:color-mix(in srgb,var(--tealink) 6%,var(--card));border:1px solid var(--tealink);border-top:5px solid var(--tealink);border-radius:12px}
.wrap{max-width:1000px;margin:0 auto;padding:clamp(4px,2px + .6vw,10px) 16px 56px}  /* extra witruimte tussen banner en eerste vak */
```

- Randkleur = `--tealink`, dezelfde kleur als de ondertitel; de lichte vulling is een tint van dezelfde kleur.
- Tussen de banner en het eerste vak zit extra witruimte (bovenpadding van `.wrap`, 4 tot 10px naargelang de breedte).
- Invoervelden, niveaubuttons en meldingsvakken blijven wit (`--card`) zodat ze afsteken tegen de lichte vulling.
- Semantische kleuren (niveau 1 tot 4, te laat, status) blijven de accentkleuren; enkel de vakranden zijn uniform.
- Tegels op het portaal behouden hun eigen accentkleur per tegel (sectie 6).

## 5. Afbeeldingen

Drie SVG-bestanden staan in de map `public/afbeeldingen/`. Vanuit `teamportaal.html` is het pad `afbeeldingen/…`, vanuit een app in `public/apps/` is het `../afbeeldingen/…` (voorbeeld hieronder voor het teamportaal):

| sleutel   | bestand       | alt-tekst | aspect-ratio |
|-----------|---------------|-----------|--------------|
| `logo`    | `logo.svg`    | `KSOM Campus Sint-Paulus – Klaar voor de toekomst!` | 1684/468 |
| `paul`    | `paul.svg`    | `""` (decoratief) | 2909/3619 |
| `paulien` | `paulien.svg` | `""` (decoratief) | 2414/4096 |

Mechanisme: elk element heeft `data-afbeelding="sleutel"`; een script koppelt dat aan een `<img>`:

```js
const AFBEELDINGEN={
 logo:   {src:'afbeeldingen/logo.svg',    alt:'KSOM Campus Sint-Paulus – Klaar voor de toekomst!'},
 paul:   {src:'afbeeldingen/paul.svg',    alt:''},
 paulien:{src:'afbeeldingen/paulien.svg', alt:''}
};
function laadAfbeeldingen(){
 document.querySelectorAll('[data-afbeelding]').forEach(el=>{
  const a=AFBEELDINGEN[el.dataset.afbeelding]; if(!a)return;
  const img=new Image(); img.src=a.src; img.alt=a.alt; img.decoding='async';
  if(!a.alt)img.setAttribute('aria-hidden','true');
  el.appendChild(img);
 });
}
```

Regels: lege alt = decoratief + `aria-hidden="true"`. Verwijs relatief naar de bestanden (zelfde map). Verzin geen nieuwe afbeeldingen en stuur geen externe afbeeldingen in.

## 6. Tegels (hoofdcomponent)

Grid:

```css
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:clamp(10px,6px + .6vw,14px)}
```

Tegel:

```css
.tile{--a:var(--teal);display:flex;flex-direction:column;gap:6px;background:var(--card);
 border:1px solid var(--line);border-top:5px solid var(--a);border-radius:12px;
 padding:clamp(12px,8px + 1vw,16px) clamp(12px,8px + 1vw,16px) clamp(10px,7px + .6vw,14px);
 color:inherit;text-decoration:none;min-height:clamp(122px,86px + 5vw,150px);position:relative}
.tile .ic{width:clamp(38px,32px + 2vw,46px);height:clamp(38px,32px + 2vw,46px);border-radius:12px;display:grid;place-items:center;
 font-size:clamp(20px,17px + 1vw,24px);background:color-mix(in srgb,var(--a) 20%,var(--card))}
.tile h3{margin:6px 0 0;font:700 clamp(15px,12px + .9vw,18px) system-ui,sans-serif}
.tile p{margin:0;color:var(--mut);font-size:clamp(13px,11px + .6vw,14.5px);line-height:1.4}
a.tile{transition:transform .15s,box-shadow .15s}
a.tile:hover{transform:translateY(-3px);box-shadow:0 8px 20px #0000001f}
.tile.off{opacity:.78}
.tile .soon{position:absolute;top:10px;right:10px;font-size:clamp(11px,10px + .3vw,12px);font-weight:600;color:var(--mut);border:1px solid var(--line);border-radius:99px;padding:1px 9px}
.tile.new{border-style:dashed;border-top-style:dashed;background:transparent}
```

Tegelstructuur:
1. Icoon (emoji) in een gekleurd vierkantje `.ic` (`aria-hidden="true"`).
2. Titel `h3`.
3. Korte beschrijving `p` (1 zin, `--mut`).

Tegelstatussen:
- **Actief** (heeft `href`): `<a class="tile" href="…">`, klikbaar, hover-lift.
- **Nog niet beschikbaar** (geen `href`): `<div class="tile off">` met `<span class="soon">Binnenkort</span>`; geen link, opacity .78.
- **"Nieuw/uitnodiging"-tegel** (`.new`): gestippelde rand (`border-style:dashed`), transparante achtergrond; voor "Ik wil ook een tegel".

Tegels worden **uit data gegenereerd** (zie sectie 7), niet met de hand uitgeschreven.

## 7. Data-gedreven tegels (JS-patroon)

Een `TILES`-array is de enige plek waar je tegels toevoegt. Velden:

| veld   | betekenis |
|--------|-----------|
| `n`    | naam (titel) |
| `i`    | emoji-icoon |
| `t`    | korte beschrijving |
| `c`    | accentkleur als CSS-variabele-naam: `'--teal'`, `'--g'`, `'--o'`, `'--b'`, `'--r'` |
| `href` | (optioneel) link; mét `href` wordt de tegel klikbaar, zonder komt "Binnenkort" |
| `nw`   | (optioneel) `1` = gestippelde "nieuw"-tegel |

```js
const TILES=[
 {n:'Vakgroepwerking',i:'🧭',t:'Schaal je vakgroep in, kies doelen en plan acties.',c:'--teal',href:'apps/vakgroepcompas.html'},
 {n:'GOK',i:'🤝',t:'Gelijke onderwijskansen voor alle leerlingen.',c:'--g'},
 /* … */
 {n:'Ik wil ook een tegel',i:'➕',t:'Heb je een idee voor een nieuwe toepassing? Laat het hier weten.',c:'--g',nw:1}
];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toonTegels(){
 document.getElementById('grid').innerHTML=TILES.map(x=>{
  const body=`<div class="ic" aria-hidden="true">${x.i}</div><h3>${esc(x.n)}</h3><p>${esc(x.t)}</p>`,
        st=`style="--a:var(${x.c})"`;
  return x.href
   ? `<a class="tile${x.nw?' new':''}" ${st} href="${esc(x.href)}">${body}</a>`
   : `<div class="tile off${x.nw?' new':''}" ${st}>${body}<span class="soon">Binnenkort</span></div>`;
 }).join('');
}
```

Altijd door `esc()` halen wat in `innerHTML` komt.

Bestaande tegels en hun kleur (voor consistentie): Vakgroepwerking (teal, actief), GOK (groen), Gedragen aanpak (oranje), Erasmus (blauw), AI beleid (rood), Visie (teal), Ideeënbus (oranje), Probleem melden (rood), Vertrouwenspersonen (blauw), AI team (oranje, actief → `apps/ai_team.html`), Ik wil ook een tegel (groen, nieuw), Ontwikkelaarsinfo (oranje, actief → `apps/develop.html`).

## 8. Titel op één lijn (JS-patroon)

```js
function pasTekstAan(){
 const txt=document.querySelector('.txt');
 txt.style.removeProperty('--fit');
 const cs=getComputedStyle(txt),
       beschikbaar=txt.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
 const breedte=el=>{const r=document.createRange();r.selectNodeContents(el);return r.getBoundingClientRect().width};
 const nodig=Math.max(...[...txt.children].map(breedte));
 if(nodig>beschikbaar)txt.style.setProperty('--fit',(beschikbaar/nodig*0.98).toFixed(3));
}
/* start */
laadAfbeeldingen(); toonTegels(); pasTekstAan();
new ResizeObserver(pasTekstAan).observe(document.querySelector('.hero'));
if(document.fonts)document.fonts.ready.then(pasTekstAan);
```

## 9. Toegankelijkheid en interactie

- Focus: `:focus-visible{outline:3px solid var(--b);outline-offset:3px}`. Nooit verwijderen.
- Reduced motion: `@media (prefers-reduced-motion:reduce){a.tile{transition:none}a.tile:hover{transform:none}}`. Elke animatie/hover-beweging heeft zo'n uitzondering.
- Decoratieve emoji's en afbeeldingen: `aria-hidden="true"`.
- Semantiek: `header`, `main`, `h1` (1×), `h2.sec` voor sectietitels, `h3` binnen kaarten.
- Contrast: tekst in accent altijd `--tealink`/`--ink`/`--mut`, nooit `--g` of `--teal` op witte achtergrond voor lopende tekst.
- Klikbare elementen zijn echte `<a>` of `<button>`, niet `<div onclick>`.

## 10. Toon en schrijfstijl (inhoud)

- Nederlands, informeel-professioneel, "je/jij" (geen "u"). Collegiaal en uitnodigend ("Hier bouwen we samen aan de school van morgen.").
- Titels kort; beschrijvingen 1 zin, vaak als vraag of belofte ("Waar staan we voor en waar gaan we naartoe?").
- Eén sleutelzin mag met een oranje `<span>` benadrukt worden.
- Schoolcontext: TISP / KSOM Campus Sint-Paulus, voor leerkrachten en teamleden (intern teamportaal).

## 11. Code-conventies

- Eén bestand, inline `<style>` en `<script>`; geen build-stap, geen frameworks, geen externe bronnen. Uitzonderingen: de gedeelde scripts `../js/aanmelding.js` (op elke pagina), `../js/opslag.js` (als de app gegevens bewaart) en `../js/vakgroepcompas_onderdelen.js` (de pagina's van het Vakgroepkompas).
- CSS: compact, variabelen eerst, `clamp()` voor schaling, `color-mix()` voor tinten, container queries (`cqw`) voor de banner.
- JS: opgesplitst in genummerde, commentarieerde modules (`/* ===== MODULE 1: AFBEELDINGEN ===== */`, …) en een `/* ===== START ===== */`-blok onderaan. Commentaar is Nederlands en legt het "waarom" uit.
- Variabelen/functies hebben Nederlandse namen (`laadAfbeeldingen`, `toonTegels`, `pasTekstAan`, `beschikbaar`, `nodig`, `breedte`).
- Configuratie bovenaan elke module als constante (`AFBEELDINGEN`, `TILES`) zodat niet-programmeurs eenvoudig kunnen aanpassen (bv. link invullen bij `href`).
- Elke app is één html-bestand in `public/apps/`. Het teamportaal linkt ernaar met `apps/<naam>.html`; een app linkt terug met `../teamportaal.html`.
- Elke pagina laadt in de `<head>` `<script src="../js/aanmelding.js"></script>`: wie niet aangemeld is, gaat naar `login.html`, en bovenaan verschijnt wie aangemeld is. Is de pagina niet voor iedereen, zet dan het recht erbij: `data-recht="directie-overzicht"`. Twee rechten gescheiden door een spatie = het ene óf het andere. In de code vraag je `await Aanmelding.klaar` (wie is aangemeld), `Aanmelding.mag('recht')` en `Aanmelding.magVakgroep('Wiskunde')`. Elk recht staat in de catalogus `server/rechten.json`; welke rol wat krijgt in `server/rollen.json`; per persoon bijgesteld (`extra`, `zonder`, `vakgroepen`) in `gegevens/gebruikers.json`. Nieuwe tegel of pagina = één regel in `rechten.json`, dezelfde naam bij de tegel (`recht:'…'`) en op de pagina (`data-recht`). De server controleert hetzelfde recht bij elke vraag (`server/rechten.js`).
- Gegevens bewaren gebeurt alleen via `public/js/opslag.js` (`<script src="../js/opslag.js"></script>`): `Opslag.bewaar(naam, gegevens)`, `Opslag.laad(naam)` en `Opslag.lijst(begin)`. Gebruik geen localStorage en geen "bewaar als bestand"-knoppen voor gegevens. Kies een naam die begint met de app, bv. `vakgroep-wiskunde`.

## 12. Sjabloon voor een nieuwe pagina

```html
<!DOCTYPE html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>TISP – [paginanaam]</title>
<script src="../js/aanmelding.js"></script><!-- eventueel met data-recht="..." -->
<style>
/* 1. Plak hier :root, body, .wrap uit sectie 1 en 3 */
/* 2. Plak hier de hero-CSS uit sectie 4 en 4b (slanke banner) */
/* 3. Plak hier de componenten die je nodig hebt (tegels, h2.sec, …); op zijpagina's de kaartstijl uit 4c */
/* 4. :focus-visible en prefers-reduced-motion uit sectie 9 */
</style></head><body>
<header class="hero slim"><div class="hero-in"><!-- zijpagina: hero slim zonder logo; startpagina: hero met logo -->
  <div class="txt"><h1>[Paginatitel]</h1><p>[Ondertitel in 1 kleur]</p></div>
  <div class="duo">
    <div class="paul" data-afbeelding="paul"></div>
    <div class="paulien" data-afbeelding="paulien"></div>
  </div>
</div></header>
<div class="wrap"><main>
  <h2 class="sec">[Sectietitel]</h2>
  <!-- inhoud: tegels, kaarten, tekst -->
</main></div>
<script>
/* AFBEELDINGEN (sectie 5) · eigen modules · pasTekstAan (sectie 8) · START */
</script></body></html>
```

Terugkeerlink naar het portaal (voor subpagina's): gebruik een kleine link of tegelstijl-knop naar `../teamportaal.html`, zelfde kleuren en focusring.

## 13. Nieuwe componenten ontwerpen in dezelfde stijl

Als de pagina iets nodig heeft wat hierboven niet staat (formulier, tabel, melding, knop), volg dan:
- Achtergrond `--card`, rand `1px solid var(--line)`, radius `12px`, padding via `clamp(12px,8px + 1vw,16px)`.
- Portaal: accent via `--a` en een dikke bovenrand van 5px. Zijpagina's: zelfde randvorm maar in 1 uniforme kleur (`--tealink`, gelijk aan de ondertitel), met lichte vulling (4c); meldingen krijgen een 4px linkerrand.
- Primaire knop: achtergrond `--tealink`, witte tekst, radius `12px` (of `99px` voor kleine pillen), gewicht 600, zelfde focusring.
- Invoervelden: witte achtergrond, `1px solid var(--line)`, radius `8–12px`, focus = blauwe focusring `--b`.
- Foutmelding in `--r`, succes in `--g` (tekst donker houden voor contrast, kleur alleen voor rand/tint/icoon).
- Tekst blijft `--ink`, hulptekst `--mut`.

## 14. Checklist vóór oplevering

- [ ] Eén zelfstandig html-bestand, `lang="nl"`, viewport met `viewport-fit=cover`
- [ ] Alleen tokens uit sectie 1, systeemlettertype, geen externe bronnen
- [ ] Banner: grote banner (met logo) enkel op het portaal; `hero slim` zonder logo op zijpagina's; ondertitel in 1 kleur; titel + ondertitel op 1 lijn
- [ ] `.wrap` max 1000px, safe-area padding aanwezig
- [ ] Tegels uit data gegenereerd, tekst door `esc()`
- [ ] Focusring en `prefers-reduced-motion` aanwezig
- [ ] Decoratieve elementen `aria-hidden`, alt-teksten ingevuld waar nodig
- [ ] Nederlandse teksten in de je-vorm, korte titels en 1-zin-beschrijvingen
- [ ] Commentaar in genummerde modules, configuratie bovenaan
