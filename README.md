# TISP Teamportaal

Samenwerkingsportaal voor het team van TISP. `teamportaal.html` is het hart: het
toont alleen tegels die naar de apps verwijzen. Elke app is een eigen
html-pagina.

## Starten

1. Installeer één keer **Node.js (LTS)** via <https://nodejs.org>.
2. Dubbelklik op **`start.bat`**. Er opent een zwart venster (de server) en je
   browser toont <http://localhost:8000>.
3. Kies op de loginpagina een testgebruiker.
4. Laat het zwarte venster open zolang je werkt. Sluit het om te stoppen.

Zonder Windows: voer `npm start` uit in deze map en open <http://localhost:8000>.

Open de html-bestanden niet met een dubbelklik: dan draait er geen server en
wordt er niets bewaard.

## Mappen

```text
start.bat              start de server en opent de browser
server/server.js       de server
server/hulp.js         kleine hulpfuncties voor de server: antwoord sturen en meegestuurde JSON lezen
server/instellingen.js poort, adres en de map met gegevens (aanpasbaar zonder code te wijzigen)
server/opslag.js       de enige plek waar de server gegevens leest en bewaart
server/uitchecken.js   wie een kompas aan het bewerken is, en de versie van wat bewaard is
server/aanmelding.js   aanmelden, afmelden en "wie ben ik?"
server/rechten.js      beslist wat iemand mag (rol + extra − zonder, eigen vakgroepen)
server/rechten.json    de catalogus: elk recht met korte naam, soort (tegel/beheer) en uitleg
server/rollen.json     de rechten per rol
server/gebruikers.js   gebruikers en vakgroepen beheren (/api/gebruikers, /api/vakgroepen, /api/rechten)
server/gebruikers.json de testgebruikers (vertrekpunt voor gegevens/gebruikers.json)
server/mijn_vakgroepen_resultaten.js  welke vakgroepen iemand volgt op de resultatenpagina (/api/mijn_vakgroepen_resultaten)
public/                de website (dit deel komt later online)
  login.html           loginpagina (nu: kies een testgebruiker)
  teamportaal.html     startpagina met de tegels
  apps/                elke app een eigen pagina
  js/aanmelding.js     beschermt elke pagina en toont wie aangemeld is
  js/opslag.js         bewaren en laden, gedeeld door alle apps
  js/vakgroepcompas_onderdelen.js  de onderdelen van het kompas (standaardlijst + laden)
  afbeeldingen/        logo en tekeningen
docs/huisstijl.md      huisstijl, ook als instructie voor AI
docs/hosting.md        voor de ICT-dienst: het portaal online zetten
Dockerfile             recept waarmee een host het portaal start
.env.example           voorbeeld van de instellingen
test/                  automatische tests (npm test)
ontwerpen/             bronbestanden die de website niet gebruikt
gegevens/              je bewaarde gegevens (alleen op je pc, niet op GitHub)
```

## Hoe het aanmelden werkt

```text
login.html  →  server onthoudt wie je bent (sessiecookie)  →  elke pagina vraagt via js/aanmelding.js "wie ben ik?"
```

- Er zijn 4 testgebruikers: leraar, middenkader, directie en beheerder. Een
  wachtwoord is er nog niet. De gebruikers staan in `gegevens/gebruikers.json`;
  bestaat dat nog niet, dan geldt `server/gebruikers.json` als vertrekpunt.
- Herstart je de server, dan ben je afgemeld.

## Wie mag wat?

```text
rechten van je rol (server/rollen.json)  +  extra  −  zonder  →  jouw lijst met rechten
```

- `server/rechten.json` is de catalogus: elk recht dat bestaat, met uitleg.
  Komt er een tegel of pagina bij, voeg dan daar één regel toe.
- `server/rollen.json`: de rechten per rol. Leraar en middenkader hebben de
  gewone tegels. Directie heeft `"alles"` behalve `ontwikkelaarsinfo` en `onderdelen-verwijderen`, de
  beheerder heeft `"alles"`.
- Per persoon (`gegevens/gebruikers.json`): `extra` geeft iemand een recht
  erbij, `zonder` neemt er een weg. Zo zet je tegels aan of uit voor één
  gebruiker.
- Vakgroepen: elke gebruiker heeft `vakgroepen`, bv.
  `[{ "naam": "Wiskunde", "hoofd": true }, { "naam": "Frans" }]`. Iedereen
  bewaart alleen in zijn eigen vakgroepen, ook directie en beheerder. Wie de
  resultaten of de instellingen van het Vakgroepkompas mag zien
  (`directie-overzicht`, `vakgroepcompas-config`) of het recht
  `alle-vakgroepen` heeft, leest wel alle vakgroepen. Wie `hoofd` is van een vakgroep, krijgt vanzelf
  `vakgroep-koppelen`: leraren koppelen aan of loskoppelen van die vakgroep.
  De lijst van vakgroepen staat in `gegevens/vakgroepen.json`; alleen directie
  en beheerder (`gebruikers-beheer`) passen die aan.
- De server controleert alles zelf (`server/rechten.js`): een verborgen tegel is
  nooit de enige beveiliging. Mag je een bestand niet lezen of bewaren, dan
  antwoordt hij 403.
- Een pagina beschermen: `<script src="../js/aanmelding.js"></script>` in de
  `<head>`. Alleen voor wie een recht heeft: voeg `data-recht="..."` toe. Een
  tegel in het teamportaal: geef de tegel `recht:'...'` (zelfde naam). In de
  code: `Aanmelding.mag('recht')` en `Aanmelding.magVakgroep('Wiskunde')`.
  Twee rechten met een spatie (`'directie-overzicht vakgroepcompas-config'`)
  betekent: het ene óf het andere.
- Beheer via de server: `GET /api/gebruikers`, `PUT /api/gebruikers/<id>`,
  `GET /api/vakgroepen`, `PUT /api/vakgroepen` en `GET /api/rechten` (de
  catalogus en de standaardrechten per rol). De server past alleen toe wat
  jij mag: een vakgroephoofd ziet en wijzigt enkel de koppelingen voor zijn
  eigen vakgroep, niet de rol of de tegels van iemand, en kan geen ander
  vakgroephoofd loskoppelen. Niemand kan zijn eigen rol aanpassen.
- Directie en beheerder doen dat op `apps/gebruikersbeheer.html` (tegel
  "Gebruikersbeheer"): per vakgroep leden koppelen en vakgroephoofd aanduiden,
  per gebruiker rol, vakgroepen en tegels, en vakgroepen toevoegen of
  verwijderen.
- Een vakgroephoofd doet dat op `apps/vakgroepbeheer.html` (tabblad
  "Vakgroepbeheer" in Vakgroepwerking): leraren toevoegen aan of loskoppelen
  van de vakgroepen waarvan hij hoofd is.
- Vakgroepwerking bestaat uit aparte pagina's met tabbladen bovenaan:
  Deadlines (`vakgroepcompas_deadlines.html`), Vakgroepwerking
  (`vakgroepcompas.html`), Vakgroepbeheer, Resultaten
  (`vakgroepcompas_resultaten.html`) en Instellingen
  (`vakgroepcompas_config.html`). Een tabblad is een gewone link. Je ziet
  alleen de tabbladen waarvoor je het recht hebt; de lijst staat in
  `public/js/vakgroepcompas_tabs.js`. In het teamportaal is er één tegel: die
  opent het eerste tabblad dat je ziet.
- Het tabblad Deadlines zie je alleen als er deadlines zijn. Dan opent de tegel
  Vakgroepwerking eerst die tab.

## Hoe het bewaren werkt

```text
app (bv. vakgroepcompas.html)  →  js/opslag.js  →  server/server.js  →  server/opslag.js  →  gegevens/<naam>.json
```

- Een app bewaart en laadt alleen via `opslag.js`:
  `Opslag.bewaar('vakgroep-wiskunde', gegevens)`, `Opslag.laad('vakgroep-wiskunde')`
  en `Opslag.lijst('vakgroep-')`.
- De server weet niets over de apps: hij bewaart elke naam via
  `server/opslag.js` als een gewoon JSON-bestand in `gegevens/`. Je kunt die
  bestanden in Kladblok openen.
- Tegelijk bewaren: `server/opslag.js` bewaart alles één voor één (een
  wachtrij), zodat twee bewaringen nooit door elkaar lopen en een bestand
  beschadigen. Deelt een bestand gegevens van meerdere gebruikers (bv.
  `gebruikers.json`), dan gebruikt de server `opslag.wijzig(naam, aanpassing)`:
  lezen, aanpassen en bewaren als één stap, zodat niemand de wijziging van een
  ander overschrijft.
- Samen in hetzelfde Vakgroepkompas: één collega bewerkt, de rest kijkt mee.
  - Uitchecken: wie iets wijzigt, krijgt het kompas van die vakgroep. De
    anderen zien wie bezig is en hun velden en knoppen staan uit.
  - Vrijgeven: 5 seconden na de laatste bewaring, als de bewerker niet meer in
    een tekstvak staat. Valt een browser weg, dan vervalt de uitcheck op de
    server na een minuut (`server/uitchecken.js`).
  - Meekijken: elke open pagina vraagt om de 2 seconden wie bezig is en of er
    een nieuwere versie is, en ververst dan vanzelf.
  - Onderhoud: de onderdelen aanpassen kan pas nadat de beheerder het
    Vakgroepkompas offline haalt (`vakgroepcompas_config.html`). Dat lukt
    alleen als niemand een kompas bewerkt. Tot het is vrijgegeven, kan niemand
    een kompas wijzigen. Vrijgeven gebeurt met de knop, bij het verlaten van de
    pagina of na 10 minuten zonder activiteit. Daarna blijft alles nog 10
    seconden vast, zodat elke open pagina eerst de nieuwe onderdelen laadt.
  - Versie: de server weigert een bewaring of uitcheck van wie niet de laatst
    bewaarde versie voor zich heeft. De pagina laadt dan de nieuwste versie;
    alleen die ene wijziging moet opnieuw.
  - De server controleert dit zelf: de uitgeschakelde velden zijn alleen
    comfort.
- In het Vakgroepkompas kies je je vakgroep uit een lijst: je eigen gekoppelde
  vakgroepen, of alle vakgroepen als je ze mag lezen. Het kompas van een
  vakgroep die niet de jouwe is, bekijk je alleen: alle velden staan uit. Het
  schooljaar staat vast op het huidige (vanaf 1 september het volgende).
- Het Vakgroepkompas bewaart automatisch, een halve seconde na elke wijziging,
  in `gegevens/vakgroep-<naam>.json`. `apps/vakgroepcompas_resultaten.html`
  toont alle vakgroepen uit die map.
- Welke vakgroepen een directielid volgt onder "Mijn vakgroepen" op de
  resultatenpagina, staat per gebruiker in `gegevens/mijn_vakgroepen_resultaten.json`
  (bv. `{"directie": ["Frans", "Wiskunde"]}`), via `/api/mijn_vakgroepen_resultaten`.
  Later in een databank wordt dat één tabel `mijn_vakgroepen_resultaten (gebruiker, vakgroep)`.
- De onderdelen van het kompas (V, O1…O8 met hun niveaus en groeitips) pas je
  aan in `apps/vakgroepcompas_config.html`. Ze komen in
  `gegevens/vakgroepcompas-onderdelen.json`; bestaat dat bestand niet, dan
  geldt de standaardlijst in `public/js/vakgroepcompas_onderdelen.js`.
  Elk onderdeel heeft een vast `id` (bv. `o1`) dat nooit verandert. De scores,
  prioriteiten en reflecties van de vakgroepen hangen aan dat `id`, niet aan
  de naam. Een naam wijzigen raakt de vakgroepbestanden dus niet.
  Verwijderde onderdelen gaan naar een archief; de scores van de vakgroepen
  blijven staan en komen terug als je het onderdeel terugzet. Een vakgroep
  met een lopende prioriteit op een gearchiveerd onderdeel kan die cyclus nog
  afwerken; de beheerpagina waarschuwt daarvoor bij het archiveren.
  Definitief verwijderen uit het archief vraagt het recht
  `onderdelen-verwijderen` (standaard alleen de rol Beheerder); de server
  controleert dat bij het bewaren.
- De deadlines staan in `gegevens/vakgroepcompas-deadlines.json`:
  `{ "uitleg": "…", "deadlines": [{ "d": "2026-12-04", "n": "Naam", "t": "Korte uitleg" }] }`.
  Je past ze en de uitleg aan op de kaart Deadlines in
  `apps/vakgroepcompas_config.html`, zonder het Vakgroepkompas offline te halen.
  Iedereen leest ze; bewaren vraagt `vakgroepcompas-config`. Is de lijst leeg
  of bestaat het bestand niet, dan is er geen tabblad Deadlines. Collega's
  zien een wijziging de volgende keer dat ze een pagina openen.
- Een bestand dat je vroeger met "Bewaar als bestand" maakte
  (`vakgroep-wiskunde.json`) kun je gewoon in `gegevens/` zetten.

## Een nieuwe app toevoegen

1. Maak `public/apps/<naam>.html` (volg `docs/huisstijl.md`) en laad
   `<script src="../js/aanmelding.js"></script>`.
2. Voeg in `public/teamportaal.html` een tegel toe met `href:'apps/<naam>.html'`.
3. Moet de app iets bewaren? Laad `<script src="../js/opslag.js"></script>` en
   gebruik `Opslag.bewaar` en `Opslag.laad` met een naam die begint met de app.

## Later online

Zie `docs/hosting.md`: wat de ICT-dienst nodig heeft om het portaal online te
zetten. Kort:

- De pagina's in `public/` blijven hetzelfde.
- Poort, adres en de map met gegevens zijn instellingen (`server/instellingen.js`,
  voorbeeld in `.env.example`). Zonder instellingen werkt alles zoals op je pc:
  poort 8000 en alleen bereikbaar vanaf je eigen pc.
- Naar een databank: pas alleen `server/opslag.js` aan.
- Echte login: vervang `login.html` en `aanmelden` in `server/aanmelding.js`; de
  pagina's blijven `Aanmelding.klaar` en `Aanmelding.mag(...)` gebruiken.
- `npm test` controleert aanmelden, rechten en bewaren.
