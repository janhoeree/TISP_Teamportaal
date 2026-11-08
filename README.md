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
server/gebruikers.json de testgebruikers
server/rollen.json     de rechten per rol
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

- Er zijn 4 testgebruikers (`server/gebruikers.json`): leraar, middenkader,
  directie en beheerder. Een wachtwoord is er nog niet.
- Rechten staan in `server/rollen.json`. Leraar en middenkader krijgen later
  een lijst met rechten. Directie heeft alle rechten behalve
  `ontwikkelaarsinfo`, de beheerder heeft alle rechten.
- Rechten die nu gebruikt worden:
  - `directie-overzicht`: `apps/vakgroepcompas_resultaten.html`
  - `vakgroepcompas-config`: `apps/vakgroepcompas_config.html`
  - `ontwikkelaarsinfo`: `apps/develop.html`
- Een pagina beschermen: `<script src="../js/aanmelding.js"></script>` in de
  `<head>`. Alleen voor wie een recht heeft: voeg `data-recht="..."` toe. Een
  tegel in het teamportaal verbergen: geef de tegel `recht:'...'`.
- Gegevens lezen of bewaren kan alleen als je aangemeld bent.
- Herstart je de server, dan ben je afgemeld.

## Hoe het bewaren werkt

```text
app (bv. vakgroepcompas.html)  →  js/opslag.js  →  server/server.js  →  gegevens/<naam>.json
```

- Een app bewaart en laadt alleen via `opslag.js`:
  `Opslag.bewaar('vakgroep-wiskunde', gegevens)`, `Opslag.laad('vakgroep-wiskunde')`
  en `Opslag.lijst('vakgroep-')`.
- De server weet niets over de apps: hij bewaart elke naam als een gewoon
  JSON-bestand in `gegevens/`. Je kunt die bestanden in Kladblok openen.
- Het Vakgroepkompas bewaart automatisch, een halve seconde na elke wijziging,
  in `gegevens/vakgroep-<naam>.json`. `apps/vakgroepcompas_resultaten.html`
  toont alle vakgroepen uit die map.
- De onderdelen van het kompas (V, O1…O8 met hun niveaus en groeitips) pas je
  aan in `apps/vakgroepcompas_config.html`. Ze komen in
  `gegevens/vakgroepcompas-onderdelen.json`; bestaat dat bestand niet, dan
  geldt de standaardlijst in `public/js/vakgroepcompas_onderdelen.js`.
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
