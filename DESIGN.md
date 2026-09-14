# Masseria Battaglini

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

Fino a 1100 px: logo e comando Menu con etichetta, pannello color calce,
grandi voci serif, pulsante disponibilità e indicazione del luogo.
Gestione indipendente dal 3D, contenuti sottostanti inerti durante l’apertura,
focus contenuto nel menu, Escape e ripristino dello scroll anche al resize.
Senza JavaScript i link rimangono visibili; movimento ridotto senza transizioni.

Verifica del 14 settembre 2026: build delle quattro pagine, sintassi JS,
ispezione desktop e mobile, nessun overflow a 1101, 390 e 320 px; apertura,
Escape, ciclo del focus, navigazione tra pagine, voce corrente e resize con
menu aperto. Il pulsante disponibilità chiude il pannello, riattiva lo scroll
e raggiunge il modulo. Nessun errore nella console della verifica browser.
