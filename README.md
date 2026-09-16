# Masseria Battaglini · sito e pannello di gestione

Sito statico generato da `build.mjs`: i contenuti stanno in `content/*.json`, i template in `src/`,
i file statici in `public/`. Il pannello di gestione (Sveltia CMS) è in `admin/` e modifica solo i
file di `content/` e le foto in `public/uploads/`.

## Come funziona per il cliente

1. Apre `https://alessiochirenti.github.io/masseria-battaglini/admin/`
2. Entra con il proprio accesso (vedi sotto)
3. Sceglie la pagina (Home, Il racconto, Le dimore, Esperienze, Dati generali e contatti)
4. Modifica testi, foto, gallerie, etichette, contatti; salva
5. Ogni salvataggio resta nello storico e si può ripristinare. Le modifiche ai testi richiedono anche
   l’aggiornamento delle quattro traduzioni: la pubblicazione si ferma se una lingua è incompleta.

Non può: aggiungere sezioni nuove, cambiare layout, animazioni, colori, font. Quello è nel codice.

## Accesso al pannello

Il pannello legge e scrive sul repository GitHub. Due modi:

- **Token personale** (subito, senza configurazione): sulla schermata di accesso, "Sign In with Token".
  Il token si crea su GitHub (Settings → Developer settings → Fine-grained tokens) con accesso al solo
  repository `masseria-battaglini`, permesso *Contents: read and write*. Si incolla una volta, resta salvato nel browser.
- **Accesso con un clic** (per il cliente, quando il sito è definitivo): un piccolo servizio di
  autenticazione gratuito (Sveltia CMS Authenticator su Cloudflare Workers) e il tasto "Sign In with GitHub".

## Sviluppo

```
node build.mjs      # genera dist/
npm run check:i18n   # controlla tutte le lingue e le 20 pagine generate
```

Per vedere il sito in locale serve un server statico qualsiasi che punti a `dist/`
(le pagine usano moduli ES, non si aprono da file://).

## Cinque lingue, un solo sito

L’italiano è la lingua principale, nelle pagine della radice. Inglese, francese, tedesco e spagnolo
sono disponibili nelle cartelle `en/`, `fr/`, `de/` e `es/`: quattro pagine per lingua, venti in totale.
Foto, video, font e JavaScript sono condivisi. La traduzione è già nell’HTML; non richiede servizi
esterni, librerie di traduzione o chiamate aggiuntive. La lingua non cambia automaticamente.

Il selettore mantiene la pagina e la sezione raggiunta. I link delle pagine restano nella lingua
scelta; ciascuna pagina ha `lang`, canonical e alternative `hreflang`, con italiano come `x-default`.
L’opzione di non indicizzazione esistente rimane valida per tutte le versioni.

### Ogni modifica va fatta in tutte le lingue

1. Modificare l’italiano in `content/*.json`. Le etichette di interfaccia, i testi dei moduli e i
   messaggi JavaScript sono in `content/ui.json`; le trascrizioni in `content/guestbook.json`.
2. Aggiornare **tutti e quattro** i file `locales/{en,fr,de,es}.json`. Ogni chiave è il testo italiano
   esatto, ogni valore è la traduzione. Se cambia la chiave italiana, aggiornare anche quella dei cataloghi.
3. Per nuovi testi dell’interfaccia, aggiungere prima una voce a `content/ui.json`, poi le traduzioni;
   nei template usare `{{ui.nome}}`, in JavaScript `t('Testo italiano')`. Non inserire testo pubblico
   fisso direttamente nei template o negli script.
4. Rigenerare l’indice con `node scripts/i18n.mjs --catalog`. `locales/source.json` indica in quali campi
   è usata ogni frase; è un riferimento per la manutenzione, non un catalogo da tradurre.
5. Eseguire `node build.mjs` e `npm run check:i18n`, poi verificare desktop e mobile, includendo tedesco,
   selettore, menu, ancore, moduli, gallerie e libro degli ospiti.

Il build controlla le traduzioni **prima** di sostituire `dist/`: un testo nuovo, una traduzione vuota
o un segnaposto perso blocca il build. Anche la pubblicazione automatica verifica le venti pagine,
i collegamenti, le immagini e le etichette. Questo evita di pubblicare versioni miste o incomplete.
Non si modifica direttamente `dist/`, perché è rigenerata. Le istruzioni permanenti sono in `AGENTS.md`.

I nomi propri, i marchi, gli indirizzi e le firme restano originali. Le traduzioni delle recensioni
sono indicate come tali; le scansioni del libro restano intatte, accompagnate dal testo tradotto.

## Libro degli ospiti

La home include `src/_partials/ospiti.html` prima dei contatti. Le recensioni
Google e le fonti sono in `content/recensioni.json`: valutazione verificata il
14 settembre 2026, da aggiornare manualmente (non è un feed live).

Il libro usa la copertina e sette pagine estratte dal PDF dei titolari.
Scansioni, ordine, provenienza e trascrizioni originali sono in
`public/uploads/guestbook/manifest.json`. Il testo accessibile italiano è in
`content/guestbook.json`, tradotto dai cataloghi delle altre lingue; il build associa
le scansioni del manifest mantenendone l’ordine. Gli originali WebP sono nella stessa cartella.
Il motore PageFlip 2.0.7 è incluso localmente con licenza MIT in `public/js/vendor`.
Il PDF sorgente rimane sul Desktop e non viene distribuito per intero.

La verifica locale include mouse, swipe touch emulato, tastiera, zoom e
larghezze 375, 390, 768, 1024 e 1440 px. Un telefono fisico rimane utile per
la verifica conclusiva delle sensazioni tattili e del pinch.

## Pubblicazione

GitHub Actions (`.github/workflows/deploy.yml`) ricostruisce e pubblica su GitHub Pages a ogni
push su `main`. Per passare al dominio del cliente: Settings → Pages → Custom domain, poi aggiornare
`url` in `content/site.json` e `site_url` in `admin/config.yml`.

## Da fare prima del lancio

- Collegare il modulo di richiesta a un servizio di invio (oggi mostra solo la conferma).
- Attivare "Sito visibile su Google" nei Dati generali.
- Rigenerare `public/og.jpg` se cambia l'apertura.
