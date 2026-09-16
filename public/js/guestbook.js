import { t } from './i18n.js'
// Independent progressive enhancement: original pages remain readable without JS/CDNs.
const root = document.querySelector('[data-guestbook]')
if (root) {
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return
    observer.disconnect()
    enhance().catch(error => {
      root.querySelector('.gb-actions').hidden = true
      root.querySelector('.gb-accessible').open = true
      console.warn('Il libro è disponibile nelle pagine originali.', error)
    })
  }, { rootMargin: '650px' })
  observer.observe(root)
}

async function enhance() {
  const [{ PageFlip }, { createGuestbookReader }, { attachGuestbookRenderer }] = await Promise.all([
    import('./vendor/page-flip-2.0.7.js'), import('./guestbook-reader.js?v=20260916-i18n'),
    import('./guestbook-renderer.js'),
  ])
  const stage = root.querySelector('.gb-stage')
  const position = root.querySelector('.gb-position')
  const book = root.querySelector('.gb-book')
  const open = root.querySelector('.gb-open')
  const navigation = root.querySelector('.gb-navigation')
  const reading = root.querySelector('.gb-reading-actions')
  const prev = root.querySelector('.gb-prev')
  const next = root.querySelector('.gb-next')
  const read = root.querySelector('.gb-read')
  const close = root.querySelector('.gb-close')
  const counter = root.querySelector('.gb-counter')
  const instructions = root.querySelector('.gb-instructions')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const pages = [...root.querySelectorAll('.gb-transcripts article')].map(article => ({
    title: article.querySelector('h3').textContent,
    image: article.querySelector('a').getAttribute('href'),
    transcript: [...article.querySelector('p').childNodes].map(n => n.nodeName === 'BR' ? '\n' : n.textContent).join(''),
    lang: article.lang,
  }))
  const reader = createGuestbookReader(pages)
  let current = 0
  let landscape = innerWidth > 700
  let busy = false
  let bookReady = false

  root.querySelector('.gb-actions').hidden = false
  open.disabled = true
  open.firstChild.textContent = t('Preparazione del libro…') + ' '
  const images = [...book.querySelectorAll('img')]
  images.forEach(img => { img.loading = 'eager'; if (img.dataset.src) img.src = img.dataset.src })
  // Decode before permitting a flip, so even a quick first gesture reveals ink, not an empty page.
  await Promise.all(images.map(img => img.decode().catch(() => {
    throw new Error(`Pagina non disponibile: ${img.getAttribute('src')}`)
  })))

  const flip = new PageFlip(book, {
    width: 470, height: 470, size: 'stretch', minWidth: 260, maxWidth: 480,
    minHeight: 260, maxHeight: 480, showCover: true, usePortrait: true,
    autoSize: true, drawShadow: true, maxShadowOpacity: .32,
    flippingTime: 1000, mobileScrollSupport: true, swipeDistance: 35,
    showPageCorners: !reduced.matches, useMouseEvents: !reduced.matches,
    disableFlipByClick: false, startZIndex: 1,
  })

  function activeEntries() {
    const indices = landscape ? [current, current + 1] : [current]
    return indices.filter(i => i >= 1 && i <= 7).map(i => i - 1)
  }
  function sync() {
    current = flip.getCurrentPageIndex()
    landscape = flip.getOrientation() === 'landscape'
    const closed = current === 0
    const back = current === 9
    position.dataset.state = closed ? 'closed' : back ? 'back' : 'open'
    stage.dataset.mode = landscape ? 'landscape' : 'portrait'
    root.dataset.page = String(current)
    open.hidden = !closed
    navigation.hidden = closed
    reading.hidden = closed
    prev.disabled = closed || busy
    next.disabled = back || busy
    const visible = activeEntries()
    counter.textContent = closed ? t('Copertina') : back ? t('L’ultima pagina') : visible.length ?
      `${visible.length > 1 ? t('Pagine') : t('Pagina')} ${visible.map(i => i + 1).join(' '+t('e')+' ')} ${t('di')} ${pages.length}` : t('Il libro degli ospiti')
    instructions.textContent = closed ? t('Apri la copertina, poi trascina l’angolo per sfogliare.') :
      reduced.matches ? t('Usa le frecce per sfogliare. Ingrandisci per leggere ogni parola.') :
      t('Trascina un angolo o usa le frecce. Ingrandisci per leggere ogni parola.')
    read.hidden = visible.length === 0
    if (closed && (document.activeElement === close || document.activeElement === prev)) open.focus({ preventScroll: true })
    if (!closed && document.activeElement === open) next.focus({ preventScroll: true })
  }
  flip.on('init', () => { bookReady = true; sync() })
  flip.on('flip', sync)
  flip.on('changeOrientation', sync)
  flip.on('changeState', event => {
    busy = event.data !== 'read'
    // Recenter the book as its cover lifts, rather than jumping after the turn.
    if (event.data === 'flipping' && (current === 0 || current === 9)) position.dataset.state = 'open'
    if (!busy && bookReady) sync()
  })
  attachGuestbookRenderer(flip, stage)
  flip.loadFromHTML(book.querySelectorAll('.gb-page'))
  bookReady = true
  open.disabled = false
  open.firstChild.textContent = t('Apri il libro') + ' '
  sync()

  function step(direction) {
    if (busy || (direction > 0 && current === 9) || (direction < 0 && current === 0)) return
    if (reduced.matches) direction > 0 ? flip.turnToNextPage() : flip.turnToPrevPage()
    else direction > 0 ? flip.flipNext('bottom') : flip.flipPrev('bottom')
  }
  open.addEventListener('click', () => step(1))
  next.addEventListener('click', () => step(1))
  prev.addEventListener('click', () => step(-1))
  close.addEventListener('click', () => {
    if (busy) return
    flip.turnToPage(0)
    sync()
  })
  read.addEventListener('click', () => reader.open(activeEntries()[0] ?? 0, read))
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); step(1) }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1) }
    else if (event.key === 'Home') { event.preventDefault(); if (!busy) flip.turnToPage(0) }
    else if (event.key === 'End') { event.preventDefault(); if (!busy) flip.turnToPage(9) }
  })
  stage.addEventListener('click', () => { if (reduced.matches && current === 0) step(1) })
  // A disclosure changes page height; keep the existing sky/scroll anchors in sync.
  root.querySelector('.gb-accessible').addEventListener('toggle', () => window.ScrollTrigger?.refresh())
  window.ScrollTrigger?.refresh()
}
