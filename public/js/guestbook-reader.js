let readerSequence = 0

/**
 * Full-screen access to the original guestbook scans.
 * @param {{image: string, title: string, transcript: string, lang?: string}[]} pages
 * @returns {{open: (index?: number, opener?: HTMLElement) => void}}
 */
export function createGuestbookReader(pages) {
  const entries = Array.isArray(pages) ? pages : []
  const id = `guestbook-reader-${++readerSequence}`
  const dialog = document.createElement('dialog')
  dialog.className = 'guestbook-reader'
  dialog.setAttribute('aria-labelledby', `${id}-heading`)
  dialog.setAttribute('tabindex', '-1')
  dialog.setAttribute('data-lenis-prevent', '')
  dialog.innerHTML = `
    <header class="guestbook-reader__header">
      <h2 id="${id}-heading">Il libro degli ospiti</h2>
      <button class="guestbook-reader__button guestbook-reader__close" type="button" aria-label="Chiudi il libro degli ospiti">Chiudi<span aria-hidden="true" class="guestbook-reader__cross"></span></button>
    </header>
    <div class="guestbook-reader__body">
      <div class="guestbook-reader__viewport" tabindex="0" role="region" aria-label="Pagina del libro degli ospiti" aria-describedby="${id}-help" data-lenis-prevent>
        <div class="guestbook-reader__canvas"><img class="guestbook-reader__image" alt="" decoding="async" draggable="false"></div>
        <div class="guestbook-reader__feedback">
          <p class="guestbook-reader__status" role="status"></p>
          <button class="guestbook-reader__button guestbook-reader__retry" type="button" hidden>Riprova</button>
        </div>
      </div>
      <details class="guestbook-reader__transcription">
        <summary>Leggi il testo<span class="guestbook-reader__disclosure" aria-hidden="true"></span></summary>
        <div class="guestbook-reader__text" tabindex="0" data-lenis-prevent>
          <h3 class="guestbook-reader__page-title"></h3>
          <p class="guestbook-reader__transcript"></p>
        </div>
      </details>
    </div>
    <footer class="guestbook-reader__footer">
      <nav class="guestbook-reader__navigation" aria-label="Pagine del libro degli ospiti">
        <button class="guestbook-reader__button guestbook-reader__previous" type="button" aria-label="Pagina precedente"><span class="guestbook-reader__arrow guestbook-reader__arrow--previous" aria-hidden="true"></span><span class="guestbook-reader__direction">Precedente</span></button>
        <p class="guestbook-reader__counter" aria-live="polite" aria-atomic="true"></p>
        <button class="guestbook-reader__button guestbook-reader__next" type="button" aria-label="Pagina successiva"><span class="guestbook-reader__direction">Successiva</span><span class="guestbook-reader__arrow" aria-hidden="true"></span></button>
      </nav>
      <button class="guestbook-reader__button guestbook-reader__zoom" type="button" aria-pressed="false">Ingrandisci</button>
    </footer>
    <p class="guestbook-reader__sr-only" id="${id}-help">Usa le frecce sinistra e destra per cambiare pagina. Ingrandisci per scorrere la scansione nei dettagli. Premi Esc per chiudere.</p>`
  document.body.appendChild(dialog)

  const select = (name) => dialog.querySelector(`.guestbook-reader__${name}`)
  const viewport = select('viewport')
  const image = select('image')
  const status = select('status')
  const retry = select('retry')
  const previous = select('previous')
  const next = select('next')
  const counter = select('counter')
  const zoom = select('zoom')
  const transcription = select('transcription')
  const transcript = select('transcript')
  const pageTitle = select('page-title')
  const preloaded = new Set()
  let current = 0
  let loadVersion = 0
  let enlarged = false
  let restore = null

  function setZoom(value) {
    enlarged = value
    dialog.classList.toggle('is-zoomed', value)
    zoom.setAttribute('aria-pressed', String(value))
    zoom.textContent = value ? 'Riduci' : 'Ingrandisci'
    viewport.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  function loadPage(index) {
    if (!entries.length) return
    current = Math.max(0, Math.min(entries.length - 1, Math.trunc(Number(index)) || 0))
    const entry = entries[current]
    const version = ++loadVersion
    const title = entry.title || `Pagina ${current + 1}`
    setZoom(false)
    transcription.open = false
    transcription.hidden = !entry.transcript
    pageTitle.textContent = title
    transcript.textContent = entry.transcript || ''
    transcript.lang = entry.lang || 'it'
    select('text').scrollTop = 0
    counter.textContent = `${current + 1} / ${entries.length}`
    counter.setAttribute('aria-label', `Pagina ${current + 1} di ${entries.length}`)
    previous.disabled = current === 0
    next.disabled = current === entries.length - 1
    zoom.disabled = true
    retry.hidden = true
    status.textContent = 'Caricamento pagina…'
    viewport.setAttribute('aria-busy', 'true')
    dialog.classList.remove('is-loaded', 'has-error')

    const scan = new Image()
    scan.decoding = 'async'
    scan.onload = () => {
      if (version !== loadVersion || !dialog.open) return
      image.width = scan.naturalWidth
      image.height = scan.naturalHeight
      image.alt = `Scansione originale del libro degli ospiti. ${title}`
      image.src = scan.src
      viewport.style.setProperty('--guestbook-scan-width', `${Math.min(scan.naturalWidth, 1400)}px`)
      dialog.classList.add('is-loaded')
      viewport.setAttribute('aria-busy', 'false')
      status.textContent = ''
      zoom.disabled = false
      // Fetch only one adjacent original after the current page has loaded.
      const adjacent = entries[current + 1]
      if (adjacent && !preloaded.has(adjacent.image)) {
        preloaded.add(adjacent.image)
        const upcoming = new Image()
        upcoming.src = adjacent.image
      }
    }
    scan.onerror = () => {
      if (version !== loadVersion || !dialog.open) return
      dialog.classList.add('has-error')
      viewport.setAttribute('aria-busy', 'false')
      status.textContent = entry.transcript
        ? 'La pagina non si è caricata. Puoi riprovare o leggere il testo qui sotto.'
        : 'La pagina non si è caricata. Puoi riprovare.'
      retry.hidden = false
    }
    scan.src = entry.image
  }

  function rememberOverflow(element) {
    return {
      element,
      value: element.style.getPropertyValue('overflow'),
      priority: element.style.getPropertyPriority('overflow'),
    }
  }

  function open(index = 0, opener) {
    if (!entries.length) return
    if (!dialog.open) {
      const lenis = window.__lenis
      restore = {
        focus: opener instanceof HTMLElement ? opener : document.activeElement,
        overflow: [rememberOverflow(document.documentElement), rememberOverflow(document.body)],
        lenis,
        resumeLenis: !!lenis && !lenis.isStopped,
      }
      dialog.showModal()
      if (restore.resumeLenis) lenis.stop()
      document.documentElement.style.setProperty('overflow', 'hidden')
      document.body.style.setProperty('overflow', 'hidden')
    }
    loadPage(index)
    // Start on the dialog so arrow navigation works immediately; Tab reaches
    // the close button first. Native dialog handles focus containment and Esc.
    dialog.focus({ preventScroll: true })
  }

  dialog.addEventListener('close', () => {
    ++loadVersion
    if (!restore) return
    const previousState = restore
    restore = null
    previousState.overflow.forEach(({ element, value, priority }) => {
      if (value) element.style.setProperty('overflow', value, priority)
      else element.style.removeProperty('overflow')
    })
    if (previousState.resumeLenis && window.__lenis === previousState.lenis) previousState.lenis.start()
    if (previousState.focus?.isConnected) previousState.focus.focus({ preventScroll: true })
  })
  select('close').addEventListener('click', () => dialog.close())
  previous.addEventListener('click', () => loadPage(current - 1))
  next.addEventListener('click', () => loadPage(current + 1))
  retry.addEventListener('click', () => loadPage(current))
  zoom.addEventListener('click', () => setZoom(!enlarged))
  dialog.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || enlarged) return
    if (event.target.closest('button, a, input, textarea, select, summary, [contenteditable="true"], .guestbook-reader__text')) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    event.stopPropagation()
    const destination = current + (event.key === 'ArrowRight' ? 1 : -1)
    if (destination >= 0 && destination < entries.length) loadPage(destination)
  })

  return { open }
}
