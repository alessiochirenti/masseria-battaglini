# Masseria Battaglini

## Recensioni cucina e home essenziale (16 settembre 2026)

Rimosso il pannello benessere «Il tempo per prendersi cura» dalla home.
Il ciclo del giorno continua a misurare le ancore dal layout aggiornato.
Sotto il testo della cooking class, due brevi recensioni Cesarine con autore,
nota di traduzione e link alla fonte. Citazioni in corsivo, separate dal testo
con una linea sottile; due colonne su desktop, una su telefono. Nessun widget
o script aggiuntivo. Fonti documentate in ../output/recensioni-cooking-class-fonti.md.

## Esperienze compatte, video e fotografie (16 settembre 2026)

Linguaggio editoriale di ospitalità familiare; variazione 4, movimento 3,
densità 3. Tre gruppi di contenuti, in quattro pannelli: cooking class;
attenzioni di casa con olio e colazione; benessere ed escursioni in due
pannelli distinti. Eliminata la lunga stazione di testo intermedia. Yoga,
posturale e respiro condividono una voce; descrizioni sintetiche. Rimangono
gli ancoraggi tavola, tavola-ospitalita, colazione, benessere ed escursioni;
aggiunti ospitalita e olio. Testo Sublim’e e 163 ulivi ripreso dalla Home.
Il placeholder dell’olio è esplicito e sostituibile dal CMS.

Cooking class: testo breve e video verticale affiancati, tre foto sotto;
su telefono testo, video e foto in colonna. Il filmato originale IMG_2420.MOV
è tagliato da 18 a 24 secondi, 180 fotogrammi a 30 fps, senza audio, 540x960,
H.264 SDR BT.709 con faststart, 1.414.437 byte. Convertito dall’originale
HEVC HLG con tone mapping; nessuna generazione o interpolazione video.
Scaricamento all’ingresso nello schermo, riproduzione da visibilità 25%,
pausa fuori vista o scheda nascosta, comando manuale sempre disponibile.
Movimento ridotto e risparmio dati mostrano il poster fino al clic.
Nessuna nuova libreria, iframe o ticker. Senza JS restano poster e link.
Le due nuove foto sono migliorate con imagegen; la foto bambina/Giovannella
è quella già approvata per la Home. Master e prompt in ../output/foto/.

Verificati ordine dei contenuti, link, immagini, assenza di overflow ed errori
JavaScript a 1440/1024/768/375 px. Loop di sei secondi, pausa manuale
persistente e arresto fuori vista verificati nel browser locale.
Verificati inoltre poster e riproduzione manuale con movimento ridotto,
risparmio dati, contenuto senza JavaScript e gestione della visibilità della
scheda. Nessuna richiesta MP4 dal primo schermo alle quattro larghezze.
In Chrome headless, un intervallo di riproduzione di 6,5 secondi dopo il
caricamento registra 195 frame totali e 4 scartati; non è una certificazione
di fluidità su telefono fisico. Nessun errore JS sulle pagine Dimore e Racconto
dopo l’adattamento condiviso dei reveal ai contenuti senza immagine.

## Pausa al tramonto (16 settembre 2026)

Estensione del racconto editoriale per gli ospiti della Masseria: attesa,
meraviglia del paesaggio, ritorno alla sera. Variazione 5, movimento 4,
densità 1. Dopo le card, domanda centrata «I nostri tramonti?» sul cielo
fermo alla fase 3. Segue la seconda foto fornita, panoramica a tutto schermo;
la prima e la terza formano un dittico immediatamente sotto, con «Eccoli»
al centro. Il dittico resta affiancato anche su telefono, come richiesto.

La domanda affiora e sfuma nello stage sticky di 180svh; il panorama ha
un avvicinamento minimo reversibile (scala 1,035 a 1), la risposta affiora
con lo scroll. Si riusa il ticker GSAP/Lenis. La fase del cielo resta 3
fino al termine delle fotografie, poi riprende il percorso verso la notte.
Movimento ridotto: testi e fotografie statici, nessuna nuova animazione.

Originali del cliente da 414px, migliorati con imagegen integrato:
ricostruzione dei dettagli e ampliamento dell'inquadratura, non recupero
documentale di dettagli originali. Nessuna nuova generazione video.
Master, fonti e prompt sono conservati in ../output/foto/.

Verifica: 1440, 1024, 768 e 375 px; ancore di fase 3 lungo tutta la nuova
sequenza e 3,75 nella notte, scroll inverso, resize da mobile a desktop,
movimento ridotto e contenuti senza JavaScript. Nessun overflow o errore
JavaScript. Tre WebP per circa 875 KB complessivi, caricamento differito.
Chrome locale: p95 8,3 ms su 159 intervalli durante lo scroll, zero oltre
20 ms. Con CPU rallentata 4x, p95 25,1 ms (24 intervalli oltre 20 ms):
il budget di 60 fps non è rispettato in quella prova di stress. Non è
una misurazione su telefono fisico.

## La tavola e l’attenzione dei padroni di casa

Dopo la cooking class, colazione biologica fatta in casa e inclusa nel
soggiorno; chiusura della cucina con due testi editoriali: pasti privati
su richiesta e assistenza personale per ristoranti, prenotazioni e trasporti.
Due colonne su desktop, una sotto 768 px, senza altre fotografie o card.
Le immagini già presenti vengono riordinate: marmellate accanto alla
colazione, tavola serale nella galleria. Testi basati sulle indicazioni
dei proprietari riportate dal cliente, senza promessa di esaudire ogni
richiesta. Pranzo e cena non inclusi, nessun servizio quotidiano di ristorazione.
Allineati i richiami in Home, Dimore e nel modulo; nuovi testi editabili nel CMS.
Verifica: build, 1440/768/375 px, movimento ridotto e animazioni normali,
assenza di overflow ed errori JavaScript, controllo visivo dei due layout.

## Menu ed esperienze (15 settembre 2026)

Quattro voci su ogni pagina: Home, Il racconto, Le dimore, Esperienze.
Contatti rimane raggiungibile dal pulsante di disponibilità. Su desktop,
la griglia ha due colonne laterali uguali e una centrale larga quanto le
voci: il centro del menu coincide con il centro della pagina, anche dopo
lo scroll. Il menu mobile conserva apertura, focus ed Escape.

Esperienze si apre con cucina e cooking class, poi colazione e cena,
benessere e infine escursioni. Tono familiare, concreto, attento alla
lentezza delle preparazioni. Stessa direzione editoriale e stessi asset;
le fotografie saranno riviste con il cliente in un passaggio successivo.

Fonti del testo: https://cesarine.com/it/about e profilo di Giovannella
https://cesarine.com/es/h/giovannellar-martina-franca (consultati il 15/09/2026).
Il profilo conferma l’appartenenza dal 2024 e la trasmissione delle ricette
familiari. La denominazione «diplomata all’Accademia Italiana di Cucina» è
stata richiesta esplicitamente dal cliente; non è verificata dal profilo.
L’esempio dell’ammollo delle fave viene dal racconto del cliente. Il numero
di 1.500 aderenti è presente in fonti del 2024, ma non viene usato come
conteggio attuale. Nessun prezzo, programma fisso o durata promessa.

Verifica a 1440, 1280, 1101, 1024, 768 e 375 px: ordine dei contenuti,
menu mobile, nessun overflow o errore JavaScript. Centratura desktop prima
e dopo lo scroll con scarto massimo di 0,008 px; verifica sulle altre tre
pagine a 1440 px. Le prove non sostituiscono un controllo su telefono fisico.

## Dimore: Cummersa su due piani (15 settembre 2026)

Linguaggio editoriale per famiglie e amici che scelgono il proprio soggiorno.
Variazione 4, densità 3; movimento esistente della pagina, senza nuovi effetti.
Due dimore nel sommario: Trulli Battaglini e La Cummersa. Quest’ultima ha
un’unica sezione con due possibilità di soggiorno affiancate, separate solo
da spazio e filetti: piano terra oppure entrambi i piani con supplemento.
Su mobile le possibilità si dispongono in colonna. La nota di uso esclusivo
resta sempre visibile, prima delle fotografie e delle descrizioni dei piani.

Fiori di Campo è il piano terra; Luce di Luna il primo piano da aggiungere.
I piani non sono disponibili contemporaneamente a gruppi diversi. Restano
le fotografie, le gallerie e gli ancoraggi esistenti dei due piani.
Home, metadati e modulo condiviso riflettono questa struttura. Le opzioni
del modulo derivano dalle configurazioni in content/dimore.json, editabili
nel CMS insieme ai piani. Il modulo resta una demo senza invio o calendario:
la regola di esclusività dovrà essere applicata anche alla futura disponibilità.

Verifica: build delle quattro pagine, gallerie e scelta dei due piani,
nessun errore JavaScript o overflow a 1440, 1024, 768 e 375 px, lettura con
movimento ridotto e controllo visivo desktop/mobile.

## Direzione

Leggo il sito come un racconto di ospitalità familiare e paesaggio pugliese,
con un linguaggio editoriale e cinematografico. La visita attraversa un giorno,
dalla notte all'alba e di nuovo alla notte. Il lillà è il simbolo personale
della Masseria e introduce il primo capitolo.

Design variance 6, motion intensity 8 nella scena del fiore, visual density 2.
Un solo soggetto botanico e due righe di testo. La sovrapposizione del fiore
alla frase e il bagliore viola sono scelte esplicite del committente.

## Identità esistente

- Cormorant Garamond per display e corsivi, Outfit per testo e interfaccia.
- Crema #f2edde per il testo sul cielo; calce #f6f1e5 nei pannelli.
- Inchiostro #2a2118, oro #c99a4b per link e focus.
- Il cielo varia da notte #050817 a rosa pesca e blu giorno, mediante keyframe
  RGB. Il viola botanico è specifico al fiore e alle sue particelle.
- Navigazione e contatti conservano struttura e comportamento del progetto.

## Il fiore di maggio

Testo preservato: «Il racconto comincia / con un fiore di maggio.»
Reference principale: fotografia della Masseria fornita sul Desktop il
14 settembre 2026 alle 11:59. Corolle viola tubolari con quattro lobi,
margini pallidi ricurvi e boccioli magenta. La seconda fotografia mostra
un'altra varietà e non determina l'anatomia del modello. Su richiesta:
un solo stelo, una sola infiorescenza, nessuna foglia.

Tre beat nello stesso stage sticky, progress locale 0..1:

1. 0.015..0.19: comparsa di fiore e frase, intensità crescente ma raccolta.
2. 0.19..0.47: lettura e osservazione del modello, scena ferma allo stop.
3. 0.47..0.99: erosione delle superfici e dispersione ascendente in luce
   viola. Le parole sfumano prima della completa evaporazione.

Il rumore di erosione e la nascita dei punti condividono la stessa funzione
spaziale. Particelle campionate per area dei triangoli. Lo scroll inverso
ricompone il modello esattamente, senza simulazione cumulativa.

## Layout e qualità

Desktop: fiore spostato a destra e davanti al testo, sovrapposizione parziale.
Mobile: fiore nella parte alta, frase più bassa; stessa sequenza e stessa
identità botanica. Nessuna nuova interazione obbligatoria.
La preferenza di movimento ridotto mostra fiore e testo statici. Senza WebGL
si usa un render trasparente dello stesso modello senza foglie, in
`uploads/lilla-stelo.webp`. Canvas decorativo, non interattivo.

La scena usa il ticker GSAP già esistente. Canvas trasparente locale,
render sospeso fuori sezione e quando lo scroll/parallax sono fermi,
materiali condivisi, cinque draw call per il
modello più una per le particelle; DPR massimo 1.5 con adattamento al costo.
Il cielo preesistente rimane una scena distinta. Niente post-processing.
Geometria e campionamento vengono costruiti in un Web Worker. Il modello
comprende 133 corolle, 532 petali, 30 boccioli e zero foglie; 18.000 punti
su desktop e 11.000 su mobile. Le cinque superfici contano complessivamente
263.120 triangoli e circa 11,12 MiB di buffer geometrici. I petali sono volumi
sottili chiusi con UV e pigmentazione rettificata da quattro petali della
foto originale (`uploads/lilla-petali-albedo.webp`, circa 14 KB). Illuminazione
PBR e una moderata approssimazione della traslucenza del tessuto. Le corolle
derivano da un campione isolato verificato frontalmente e di tre quarti:
quattro curve spaziali, margini sottili e raccordo continuo alla gola.
Le ombre di contatto sono precalcolate in Cycles e verificate con SHA-256
sulle posizioni di ogni superficie prima di applicarle. Il browser mantiene
la geometria 3D, ma usa una luce diffusa senza ombre nette; il contributo delle
ombre precalcolate diminuisce durante l'erosione. Se il file manca o la
geometria cambia, tornano l'occlusione procedurale e le ombre realtime.
È una ricostruzione da fotografie, non una scansione.

## Verifica

Build statica, console WebGL, vista 1440/1024/768/390/375px, inversione dello
scroll, fine dissoluzione prima della fotografia successiva, resize,
preferenza movimento ridotto e fallback senza WebGL. Le prove automatiche
su desktop non sostituiscono una verifica finale su telefono fisico.

Verifiche del 14 settembre 2026 completate in Chrome locale: build di quattro
pagine, nessun errore JavaScript, nessun overflow alle larghezze elencate,
inversione esatta delle trasformazioni e dell'erosione, resize durante la
dissoluzione, menu mobile, render senza foglie di riserva senza WebGL. Controllati
visivamente gli stati integro, in evaporazione e completamente dissolto.
Movimento ridotto: scena statica senza Lenis/ScrollTrigger, contrasto corretto
sullo sfondo chiaro; ripristino WebGL verificato anche senza ticker attivo.
Prova durante scroll continuo e inverso, 199 intervalli dopo riscaldamento,
Chrome locale con NVIDIA RTX 5080 Laptop, versione 10: desktop 1440×900,
mediana 4,2 ms e p95 4,3 ms; emulazione 390×844, mediana 4,2 ms e p95
4,3 ms. A CPU rallentata 4× il p95 desktop è 12,6 ms, con otto intervalli
oltre 20 ms. Le risorse GPU restano stabili durante le inversioni. Il cambio
di GPU rispetto alle prove precedenti impedisce un confronto diretto;
questi dati non certificano le prestazioni su un telefono fisico.
Alessio ha accettato la versione 10 il 14 settembre 2026 e ne ha richiesto
la pubblicazione insieme alle modifiche delle altre task. Il giudizio visivo
indipendente è 8/10: l'accettazione non viene presentata come prova di un
punteggio oggettivo di 9/10. Anche il fallback trasparente deriva dalla
versione 10 con occlusione precalcolata.

## Recensioni e libro degli ospiti

La sezione prima del modulo raccoglie cinque estratti Google verificati e sette
scansioni dal guestbook fornito dai titolari. Linguaggio editoriale, stessa
calce e tipografia del sito. Variazione 4, motion 6 limitata allo sfoglio,
densità 3. Le recensioni scorrono ogni sei secondi, due su desktop e una su
mobile, con cinque stelle sotto ogni estratto e link alla recensione originale.
Pausa esplicita, al passaggio del mouse e al focus; niente autoplay con
movimento ridotto, fuori schermo o scheda nascosta. Le tre traduzioni sono
quelle mostrate da Google e sono etichettate. La valutazione è una fotografia
dei dati verificati, non un feed live. Il libro approvato resta invariato.

Copertina originale in tela bianca, spessore del blocco carta, ombre e apertura
rigida; pagine flessibili con piega controllata da mouse o touch. Due pagine
su desktop, una su mobile. Il libro comincia subito dai pensieri manoscritti.
Le pagine originali sono intere, senza riscrittura, ritocco o generazione AI.
Manifest e trascrizioni: public/uploads/guestbook/manifest.json. Sorgente:
PDF 2026-09-14_124921.pdf, pagine 1 (copertina), 3, 7, 9, 21, 22, 27, 28.

Il lettore a tutto schermo offre zoom, scorrimento nativo, trascrizione,
tastiera e ripristino del focus. Senza JavaScript restano disponibili tutte
le trascrizioni e i link alle scansioni; il movimento ridotto elimina le
animazioni di sfoglio. Gli asset (2,56 MB complessivi) e il motore locale
vengono caricati in prossimità della sezione. Nessun servizio esterno per il
libro, nessun embed di PDF e nessun caricamento sul primo schermo.

Verifica del guestbook (14 settembre 2026): build di quattro pagine, nessun
errore JavaScript o overflow a 1440, 1024, 768, 390 e 375 px. Verificati
apertura, drag mouse, swipe touch emulato, prima/ultima pagina, chiusura,
lettore, zoom, trascrizioni, Escape e ripristino focus, movimento ridotto.
Senza JavaScript rimangono sette originali e sette trascrizioni. Nessuna
scansione richiesta dal primo schermo; zero mutazioni DOM del libro nel
campione di inattività. Il renderer usa il ticker GSAP esistente e si stacca
quando non serve. Resta da valutare il gesto su un telefono fisico.

## Navigazione e logo Fiore di maggio

Header trasparente sul primo schermo; dopo i primi 60 px di scroll, fondo
calce smorzato rgba(230,224,216,.82), sfocatura 18 px e altezza 72 px.
Logo leggermente più raccolto e bordo del pulsante al 30% di opacità.
Il pannello mobile aperto resta opaco per leggibilità e perde il backdrop-filter.
Testo #493f45, dettaglio lillà #67476e. Voci in maiuscolo/minuscolo,
sottolineatura sottile e disponibilità in un rettangolo dal bordo leggero.
Sulle fotografie iniziali una velatura scura sostiene la leggibilità.
Il logo orizzontale riutilizza tutti e tre i gruppi vettoriali originali di
Battaglini-05-fiore-di-maggio-trasparente.svg: architettura intrecciata al
lillà, nome e dicitura Masseria. Solo posizione e scala dei gruppi cambiano.
Sul cielo è monocromatico color avorio, sulla calce mantiene i colori originali.

Fino a 1280 px: logo e comando Menu con etichetta, pannello color calce,
grandi voci serif, pulsante disponibilità e indicazione del luogo.
Gestione indipendente dal 3D, contenuti sottostanti inerti durante l’apertura,
focus contenuto nel menu, Escape e ripristino dello scroll anche al resize.
Senza JavaScript i link rimangono visibili; movimento ridotto senza transizioni.

Verifica del 14 settembre 2026: build delle quattro pagine, sintassi JS,
ispezione desktop e mobile, nessun overflow a 1101, 390 e 320 px; apertura,
Escape, ciclo del focus, navigazione tra pagine, voce corrente e resize con
menu aperto. Il pulsante disponibilità chiude il pannello, riattiva lo scroll
e raggiunge il modulo. Nessun errore nella console della verifica browser.

## Le cinque lingue · 16 settembre 2026

Italiano principale, inglese, francese, tedesco e spagnolo. Il selettore si presenta
come una breve pagina del racconto: «La stessa storia, nella vostra lingua.»,
fondo calce, carattere Cormorant, corsivo lillà e sottili righe tra i nomi delle lingue.
La lingua corrente appare per esteso, senza bandiere; il segno + diventa una piccola
croce all’apertura. Il pannello segue la navigazione mobile e resta leggibile senza JavaScript.
Le quattro voci principali rimangono esattamente al centro su desktop, con azioni a destra.

Si conservano pagina e sezione nel cambio lingua. Le frasi mantengono il tono del racconto;
titoli e paragrafi possono distribuirsi diversamente, senza altezze fisse sul testo.
Il titolo dei tramonti ha una misura dedicata sui telefoni in tedesco, per contenere la
parola Sonnenuntergänge. I sottotitoli di Esperienze restano su una riga da 1024 px.
Le recensioni tradotte sono dichiarate; le scansioni mantengono le dediche originali,
mentre le trascrizioni sono disponibili nella lingua scelta.

Verifica multilingua: tutte le venti pagine a 1440 e 375 px; formati intermedi
320, 768, 1024, 1280 e 1281 px sulle pagine Esperienze tradotte. Menu centrato,
selettore da tastiera, Escape, lingua e ancora mantenute, navigazione senza JavaScript.
Provati gallerie, video, messaggi di validazione e lettore del libro nelle cinque
lingue. Controllate anche le animazioni delle quattro pagine in francese e tedesco,
su desktop e mobile. Il controllo automatico verifica cataloghi, segnaposti,
URL, ancore, immagini e metadati prima della pubblicazione.
