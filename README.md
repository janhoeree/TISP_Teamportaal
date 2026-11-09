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
server/server.js       de lokale server
server/aanmelding.js   aanmelden, afmelden en "wie ben ik?"
server/rechten.js      beslist wat iemand mag (rol + extra − zonder, eigen vakgroepen)
server/rechten.json    de catalogus: elk recht met korte naam, soort (tegel/beheer) en uitleg
server/rollen.json     de rechten per rol
server/gebruikers.js   gebruikers en vakgroepen beheren (/api/gebruikers, /api/vakgroepen, /api/rechten)
server/gebruikers.json de testgebruikers (vertrekpunt voor gegevens/gebruikers.json)
public/                de website (dit deel komt later online)
  login.html           loginpagina (nu: kies een testgebruiker)
  teamportaal.html     startpagina met de tegels
  apps/                elke app een eigen pagina
  js/aanmelding.js     beschermt elke pagina en toont wie aangemeld is
  js/opslag.js         bewaren en laden, gedeeld door alle apps
  js/vakgroepcompas_onderdelen.js  de onderdelen van het kompas (standaardlijst + laden)
  afbeeldingen/        logo en tekeningen
docs/huisstijl.md      huisstijl, ook als instructie voor AI
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
  gewone tegels. Directie heeft `"alles"` behalve `ontwikkelaarsinfo`, de
  beheerder heeft `"alles"`.
- Per persoon (`gegevens/gebruikers.json`): `extra` geeft iemand een recht
  erbij, `zonder` neemt er een weg. Zo zet je tegels aan of uit voor één
  gebruiker.
- Vakgroepen: elke gebruiker heeft `vakgroepen`, bv.
  `[{ "naam": "Wiskunde", "hoofd": true }, { "naam": "Frans" }]`. Een leraar
  leest en bewaart alleen zijn eigen vakgroepen; directie en beheerder alle
  (recht `alle-vakgroepen`). Wie `hoofd` is van een vakgroep, krijgt vanzelf
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
  Twee rechten met een spatie (`'gebruikers-beheer vakgroep-koppelen'`)
  betekent: het ene óf het andere.
- Beheer via de server: `GET /api/gebruikers`, `PUT /api/gebruikers/<id>`,
  `GET /api/vakgroepen`, `PUT /api/vakgroepen` en `GET /api/rechten` (de
  catalogus en de standaardrechten per rol). De server past alleen toe wat
  jij mag: een vakgroephoofd ziet en wijzigt enkel de koppelingen voor zijn
  eigen vakgroep, niet de rol of de tegels van iemand, en kan geen ander
  vakgroephoofd loskoppelen. Niemand kan zijn eigen rol aanpassen.
- Dat alles doe je op de pagina `apps/gebruikers.html` (tegel "Gebruikers en
  vakgroepen"): per vakgroep leden koppelen en vakgroephoofd aanduiden, per
  gebruiker rol, vakgroepen en tegels, en vakgroepen toevoegen of verwijderen.
  Een vakgroephoofd ziet alleen het eerste tabblad, voor zijn eigen vakgroep.

## Hoe het bewaren werkt

```text
app (bv. vakgroepcompas.html)  →  js/opslag.js  →  server/server.js  →  gegevens/<naam>.json
```

- Een app bewaart en laadt alleen via `opslag.js`:
  `Opslag.bewaar('vakgroep-wiskunde', gegevens)`, `Opslag.laad('vakgroep-wiskunde')`
  en `Opslag.lijst('vakgroep-')`.
- De server weet niets over de apps: hij bewaart elke naam als een gewoon
  JSON-bestand in `gegevens/`. Je kunt die bestanden in Kladblok openen.
- In het Vakgroepkompas kies je je vakgroep uit een lijst: je eigen gekoppelde
  vakgroepen, of alle vakgroepen als je het recht `alle-vakgroepen` hebt. Het
  schooljaar staat vast op het huidige (vanaf 1 september het volgende).
- Het Vakgroepkompas bewaart automatisch, een halve seconde na elke wijziging,
  in `gegevens/vakgroep-<naam>.json`. `apps/vakgroepcompas_resultaten.html`
  toont alle vakgroepen uit die map.
- De onderdelen van het kompas (V, O1…O8 met hun niveaus en groeitips) pas je
  aan in `apps/vakgroepcompas_config.html`. Ze komen in
  `gegevens/vakgroepcompas-onderdelen.json`; bestaat dat bestand niet, dan
  geldt de standaardlijst in `public/js/vakgroepcompas_onderdelen.js`.
  De scores van de vakgroepen hangen aan de naam van het onderdeel (bv.
  "O1 – Afstemming op het leerplan"). Wijzig je een naam, dan zet de
  configpagina de scores en prioriteiten in alle vakgroepbestanden mee over.
  Verwijderde onderdelen gaan naar een archief; de scores van de vakgroepen
  blijven staan en komen terug als je het onderdeel terugzet.
- Een bestand dat je vroeger met "Bewaar als bestand" maakte
  (`vakgroep-wiskunde.json`) kun je gewoon in `gegevens/` zetten.

## Een nieuwe app toevoegen

1. Maak `public/apps/<naam>.html` (volg `docs/huisstijl.md`) en laad
   `<script src="../js/aanmelding.js"></script>`.
2. Voeg in `public/teamportaal.html` een tegel toe met `href:'apps/<naam>.html'`.
3. Moet de app iets bewaren? Laad `<script src="../js/opslag.js"></script>` en
   gebruik `Opslag.bewaar` en `Opslag.laad` met een naam die begint met de app.

## Later online

De pagina's in `public/` blijven hetzelfde. Alleen de server verhuist naar een
host en bewaart in een database in plaats van in `gegevens/`. Als de backend op
een ander adres draait, pas je alleen `public/js/opslag.js` aan. Voor de echte login
vervang je alleen `login.html` en `aanmelden` in `server/aanmelding.js`; de
pagina's blijven `Aanmelding.klaar` en `Aanmelding.mag(...)` gebruiken. De
lokale server is alleen bereikbaar vanaf je eigen pc.
