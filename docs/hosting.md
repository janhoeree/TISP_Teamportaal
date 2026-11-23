# Het Teamportaal online zetten

Voor de ICT-dienst. Deze pagina zegt wat het portaal nodig heeft, wat je instelt
zonder code aan te passen, en waar je moet zijn als je wel iets wilt aanpassen.

## Wat is het?

- Een website (`public/`: gewone html, css en javascript, geen bouwstap).
- Een kleine server (`server/`: Node.js, geen externe pakketten, geen `npm install`).
- De server toont de website, houdt bij wie aangemeld is, controleert de rechten
  en bewaart gegevens als JSON.

## Starten

Met Docker (Node zit mee in het pakket):

```text
docker build -t teamportaal .
docker run -p 8000:8000 -v teamportaal-gegevens:/gegevens teamportaal
```

Zonder Docker (Node.js 20.12 of hoger):

```text
HOST=0.0.0.0 PORT=8000 GEGEVENS_MAP=/pad/naar/gegevens npm start
```

`GET /health` antwoordt `{"ok":true}` zolang de server leeft. `npm test` start de
server met een lege tijdelijke map en controleert aanmelden, rechten en bewaren.

## Instellingen

Omgevingsvariabelen, of een bestand `.env` naast `package.json` (voorbeeld:
`.env.example`). Ze worden gelezen in `server/instellingen.js`.

| Naam | Betekenis | Standaard |
| --- | --- | --- |
| `PORT` | poort van de server | `8000` |
| `HOST` | adres waarop de server luistert; online `0.0.0.0` | `127.0.0.1` |
| `GEGEVENS_MAP` | map waarin de gegevens staan | `gegevens/` naast `server/` |

De server spreekt zelf geen https: zet er een reverse proxy of de https van de
host voor.

## Gegevens en back-up

Alles staat als JSON-bestanden in `GEGEVENS_MAP`. Die map moet blijven bestaan
na een herstart (in Docker: een volume op `/gegevens`). Een back-up is een kopie
van die map; terugzetten is de map terugplaatsen.

| Bestand | Inhoud |
| --- | --- |
| `gebruikers.json` | per gebruiker: id, naam, rol, vakgroepen (met of zonder hoofd), extra en weggenomen rechten |
| `vakgroepen.json` | de lijst van vakgroepen |
| `vakgroep-<naam>.json` | het Vakgroepkompas van één vakgroep (scores, prioriteiten, acties, reflecties) |
| `vakgroepcompas-onderdelen.json` | de onderdelen van het kompas |
| `mijn_vakgroepen_resultaten.json` | per gebruiker: welke vakgroepen hij volgt op de resultatenpagina |

Persoonsgegevens: namen van personeelsleden, hun rol en vakgroepen, en namen bij
acties in het Vakgroepkompas. Geen gegevens van leerlingen.

## Wat nog moet gebeuren voor het online kan

1. **Echte login.** Nu kiest iedereen op `login.html` een testgebruiker zonder
   wachtwoord, en `GET /api/testgebruikers` toont alle gebruikers. Zo mag het
   niet op het internet.
2. **Sessies.** De server onthoudt in zijn geheugen wie aangemeld is: na een
   herstart is iedereen afgemeld, en twee servers naast elkaar delen geen
   sessies. De cookie heeft nog geen `Secure`.
3. **Limiet op bewaren.** Er is geen maximumgrootte voor wat iemand bewaart.
4. **Uitchecken met meerdere servers.** In het Vakgroepkompas bewerkt één
   collega tegelijk een vakgroep; de anderen kijken mee. Wie bezig is, staat
   in het geheugen van de server (`server/uitchecken.js`): na een herstart is
   alles vrij, en twee servers naast elkaar delen het niet. Bewaar het dan in
   de databank. De versiecontrole bij het bewaren blijft ook dan werken, als
   `wijzig` een transactie is.
5. **Externe bronnen.** `public/apps/ai_team.html` laadt Tailwind, Font Awesome
   en Google Fonts van andere sites.

## Waar moet je zijn?

### Je blijft op Node

Twee plekken, de rest van de code hoeft niet te veranderen:

- **`server/opslag.js`: waar de gegevens staan.** Vier functies: `lees(naam)`,
  `schrijf(naam, inhoud)`, `wijzig(naam, aanpassing)` (lezen, aanpassen en
  bewaren als één stap) en `lijst(begin)`. De rest van de server gebruikt
  alleen die vier. Voor een databank herschrijf je enkel dit bestand, bv. één
  tabel met de kolommen `naam` en `inhoud` (JSON); `wijzig` wordt een
  transactie. Bewaren loopt nu door één wachtrij in de server: draaien er
  meerdere servers naast elkaar, dan is een databank nodig.
- Meekijken: elke open pagina van het Vakgroepkompas vraagt om de 2 seconden
  `GET /api/uitchecken/<naam>`. De server leest daarvoor telkens die naam uit
  de opslag. Is dat met een databank te veel, verhoog dan `KIJK_OM` in
  `public/apps/vakgroepcompas.html` of onthoud de versie in het geheugen.
- **`server/aanmelding.js` (met `public/login.html`): wie mag binnen.** De rest
  van de server vraagt alleen `gebruikerVan(req)`: de gebruiker uit de opslag
  die bij deze aanvraag hoort, of niemand. Voor een schoollogin vervang je
  `POST /api/aanmelden` en de loginpagina.

### Je stapt af van Node

Herschrijf de map `server/` (9 kleine bestanden); `public/` blijft ongewijzigd.
De pagina's verwachten precies deze adressen, met JSON als antwoord. De rechten
staan in `server/rechten.js`, `server/rechten.json` en `server/rollen.json`.
De tests in `test/` praten alleen via deze adressen met de server.

| Adres | Doet |
| --- | --- |
| `GET /api/ik` | de aangemelde gebruiker `{ id, naam, rol, rolNaam, rechten, vakgroepen }`, of `null` |
| `POST /api/aanmelden`, `POST /api/afmelden` | aanmelden (zet de sessiecookie) en afmelden |
| `GET /api/testgebruikers` | de keuzes op de test-loginpagina |
| `GET /api/gegevens/<naam>` | wat onder die naam bewaard is, of `null`; de kop `X-Versie` geeft de versie |
| `PUT /api/gegevens/<naam>` | bewaart de meegestuurde JSON onder die naam en antwoordt `{ ok, versie }`. Met `?versie=<versie>` alleen als dat nog de bewaarde versie is |
| `GET /api/uitchecken/<naam>` | `{ versie, door }`: de bewaarde versie en de naam van de collega die bezig is (`""` = niemand anders). Bij een vakgroep ook `onderhoud` (is het Vakgroepkompas offline) en `onderdelen` (versie van de onderdelen) |
| `POST /api/uitchecken/<naam>` | checkt uit voor jou of verlengt met een minuut. Met `?versie=<versie>` alleen als dat nog de bewaarde versie is |
| `DELETE /api/uitchecken/<naam>` | geeft weer vrij (bij `vakgroepcompas-onderdelen` pas na 10 seconden) |
| `GET /api/gegevens?begin=<begin>` | lijst met de inhoud van alle namen die zo beginnen en die je mag lezen |
| `GET /api/gebruikers`, `PUT /api/gebruikers/<id>` | gebruikers bekijken en aanpassen |
| `GET /api/vakgroepen`, `PUT /api/vakgroepen` | de lijst van vakgroepen |
| `GET /api/rechten` | de catalogus van rechten en de rechten per rol |
| `GET`/`PUT /api/mijn_vakgroepen_resultaten` | de eigen lijst "Mijn vakgroepen" |

De naam `vakgroepcompas-onderdelen` uitchecken haalt het hele Vakgroepkompas
offline voor onderhoud: dat lukt alleen als geen vakgroep is uitgecheckt, en
zolang het duurt weigert de server elke uitcheck of bewaring van een vakgroep
door iemand anders. De onderdelen zelf bewaren kan alleen tijdens dat
onderhoud. Het vervalt na 10 minuten zonder nieuwe `POST`.

Antwoorden bij een fout: `401` niet aangemeld, `403` geen toegang, `400`
ongeldige vraag, `409` een collega is bezig (`{ door }`) of je versie is
verouderd (`{ verouderd: true }`).

De versie is een korte code die de server uit de inhoud berekent (`versie()` in
`server/uitchecken.js`). Er wordt dus niets extra bewaard.

## Vragen aan de ICT-dienst over de login

Het portaal heeft van de login maar één ding nodig: een vast, uniek kenmerk van
de persoon (bv. het e-mailadres). Rol, vakgroepen en tegels bewaart het portaal
nu zelf (pagina Gebruikersbeheer).

1. **Met welk account melden collega's zich aan** (Microsoft 365, Google,
   Smartschool, …) en welke gegevens levert dat: alleen e-mail en naam, of ook
   rol en vakken?
2. **Wie is de baas over rol en vakgroepen?**
   - *Het portaal (zoals nu, het eenvoudigst).* De login levert alleen wie
     iemand is; de rest staat in Gebruikersbeheer.
   - *De school.* Rol en vakken komen bij elke aanmelding mee en overschrijven
     wat in het portaal staat. Gevolg: in Gebruikersbeheer worden rol en
     vakgroepen alleen-lezen, en gegevens van iemand veranderen pas wanneer die
     zich aanmeldt. Wie nooit aanmeldde, staat niet in de lijsten, tenzij de
     school de volledige lijst geregeld doorstuurt.
3. **Wat als iemand zich voor het eerst aanmeldt en nog niet in het portaal
   staat?** Automatisch toevoegen als leraar zonder vakgroepen (het
   eenvoudigst), of weigeren tot een beheerder hem toevoegt?
4. **Moet het portaal zijn gegevens delen met een ander systeem?** Dan kan
   `GET /api/gebruikers` (gebruikers met rol en vakgroepen) alleen-lezen
   opengezet worden voor een systeem met een geheime sleutel. Dat bestaat nog
   niet.

Welk antwoord het ook wordt: alles wat van het schoolaccount komt, wordt op één
plek in `server/aanmelding.js` vertaald naar een gebruiker van het portaal.
