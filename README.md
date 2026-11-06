# TISP Teamportaal

Samenwerkingsportaal voor het team van TISP. `teamportaal.html` is het hart: het
toont alleen tegels die naar de apps verwijzen. Elke app is een eigen
html-pagina.

## Starten

1. Installeer één keer **Node.js (LTS)** via <https://nodejs.org>.
2. Dubbelklik op **`start.bat`**. Er opent een zwart venster (de server) en je
   browser toont <http://localhost:8000>.
3. Laat het zwarte venster open zolang je werkt. Sluit het om te stoppen.

Zonder Windows: voer `npm start` uit in deze map en open <http://localhost:8000>.

Open de html-bestanden niet met een dubbelklik: dan draait er geen server en
wordt er niets bewaard.

## Mappen

```text
start.bat              start de server en opent de browser
server/server.js       de lokale server
public/                de website (dit deel komt later online)
  teamportaal.html     startpagina met de tegels
  apps/                elke app een eigen pagina
  js/opslag.js         bewaren en laden, gedeeld door alle apps
  afbeeldingen/        logo en tekeningen
docs/huisstijl.md      huisstijl, ook als instructie voor AI
ontwerpen/             bronbestanden die de website niet gebruikt
gegevens/              je bewaarde gegevens (alleen op je pc, niet op GitHub)
```

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
  in `gegevens/vakgroep-<naam>.json`. De directie-weergave toont alle
  vakgroepen uit die map.
- Een bestand dat je vroeger met "Bewaar als bestand" maakte
  (`vakgroep-wiskunde.json`) kun je gewoon in `gegevens/` zetten.

## Een nieuwe app toevoegen

1. Maak `public/apps/<naam>.html` (volg `docs/huisstijl.md`).
2. Voeg in `public/teamportaal.html` een tegel toe met `href:'apps/<naam>.html'`.
3. Moet de app iets bewaren? Laad `<script src="../js/opslag.js"></script>` en
   gebruik `Opslag.bewaar` en `Opslag.laad` met een naam die begint met de app.

## Later online

De pagina's in `public/` blijven hetzelfde. Alleen de server verhuist naar een
host en bewaart in een database in plaats van in `gegevens/`. Als de backend op
een ander adres draait, pas je alleen `public/js/opslag.js` aan. Online zijn ook
een login en toegangsrechten nodig; de lokale server heeft die bewust niet en
is alleen bereikbaar vanaf je eigen pc.
