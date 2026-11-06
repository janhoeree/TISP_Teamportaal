// Kleine hulpfuncties die server.js en aanmelding.js allebei gebruiken.

function stuur(res, status, inhoud, soort = 'application/json; charset=utf-8', extraKoppen = {}) {
  res.writeHead(status, { 'Content-Type': soort, 'Cache-Control': 'no-store', ...extraKoppen });
  res.end(inhoud);
}

// Leest de JSON die de browser meestuurt. Geeft undefined als het geen geldige JSON is.
function leesJson(req) {
  return new Promise((klaar) => {
    let tekst = '';
    req.setEncoding('utf8');
    req.on('data', (stuk) => { tekst += stuk; });
    req.on('end', () => {
      try { klaar(JSON.parse(tekst)); } catch { klaar(undefined); }
    });
  });
}

module.exports = { stuur, leesJson };
