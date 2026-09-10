# Masseria Battaglini · sito e pannello di gestione

Sito statico generato da `build.mjs`: i contenuti stanno in `content/*.json`, i template in `src/`,
i file statici in `public/`. Il pannello di gestione (Sveltia CMS) è in `admin/` e modifica solo i
file di `content/` e le foto in `public/uploads/`.

## Come funziona per il cliente

1. Apre `https://alessiochirenti.github.io/masseria-battaglini/admin/`
2. Entra con il proprio accesso (vedi sotto)
3. Sceglie la pagina (Home, Il racconto, Le dimore, Esperienze, Dati generali e contatti)
4. Modifica testi, foto, gallerie, etichette, contatti; salva
5. In un paio di minuti il sito è aggiornato. Ogni salvataggio resta nello storico e si può ripristinare.

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
```

Per vedere il sito in locale serve un server statico qualsiasi che punti a `dist/`
(le pagine usano moduli ES, non si aprono da file://).

## Pubblicazione

GitHub Actions (`.github/workflows/deploy.yml`) ricostruisce e pubblica su GitHub Pages a ogni
push su `main`. Per passare al dominio del cliente: Settings → Pages → Custom domain, poi aggiornare
`url` in `content/site.json` e `site_url` in `admin/config.yml`.

## Da fare prima del lancio

- Collegare il modulo di richiesta a un servizio di invio (oggi mostra solo la conferma).
- Attivare "Sito visibile su Google" nei Dati generali.
- Rigenerare `public/og.jpg` se cambia l'apertura.
