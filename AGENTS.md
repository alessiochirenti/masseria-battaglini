# Regola permanente: tutte le lingue

Richiesta esplicita del 16 settembre 2026: l’italiano è la lingua principale;
ogni modifica pubblica va applicata anche a inglese, francese, tedesco e spagnolo.

- Modificare `content/` e tutti i cataloghi `locales/{en,fr,de,es}.json` nello stesso intervento.
- Includere titoli, testi, recensioni, trascrizioni, moduli, messaggi JavaScript, alt e metadati.
- Aggiungere le etichette a `content/ui.json`; usare i template e `t()` per l’interfaccia.
- Niente fallback silenziosi in italiano e niente traduzioni automatiche al caricamento della pagina.
- Non disattivare il controllo del build sulle traduzioni mancanti.
- Conservare tono e fatti: Cummersa unica per una famiglia/gruppo, primo piano opzionale con
  supplemento; colazione inclusa; pranzo e cena su richiesta e non inclusi.
- Conservare nomi, marchi, recapiti, firme e scansioni originali. Segnalare le recensioni tradotte.
- Rigenerare `locales/source.json` con `node scripts/i18n.mjs --catalog` quando cambia l’italiano.
- Eseguire `node build.mjs` e `npm run check:i18n`, verificare desktop e mobile in particolare in
  tedesco. Provare cambio lingua, pagina/ancora mantenuta e controlli interattivi interessati.
- Condividere gli asset fra tutte le versioni. Il sito italiano resta nella radice, le altre
  lingue nelle rispettive cartelle. Non modificare i file generati in `dist/`.

Il flusso completo è documentato in `README.md`.
