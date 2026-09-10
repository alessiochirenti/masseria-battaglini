// Galleria a tutto schermo per le dimore: ogni blocco [data-gallery] porta in
// data-photos l'elenco delle foto (JSON) che il cliente gestisce dal pannello.
// Le anteprime aprono la foto giusta (data-i), il bottone "Guardate tutte le foto"
// apre dalla prima. Frecce, tastiera, swipe, Esc. Le foto grandi si caricano solo
// quando servono, così la pagina resta leggera.

export function initGallery() {
  const blocks = document.querySelectorAll('[data-gallery]')
  if (!blocks.length) return

  const lb = document.createElement('div')
  lb.className = 'lb'
  lb.hidden = true
  lb.setAttribute('role', 'dialog')
  lb.setAttribute('aria-modal', 'true')
  lb.setAttribute('aria-label', 'Galleria fotografica')
  lb.innerHTML = `
    <button class="lb-close" type="button" aria-label="Chiudi la galleria"><span></span><span></span></button>
    <button class="lb-prev" type="button" aria-label="Foto precedente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <figure class="lb-fig"><img alt=""></figure>
    <button class="lb-next" type="button" aria-label="Foto successiva"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <p class="lb-cap"><em class="lb-title"></em><span class="lb-n"></span></p>`
  document.body.appendChild(lb)
  const img = lb.querySelector('img')
  const fig = lb.querySelector('.lb-fig')
  const title = lb.querySelector('.lb-title')
  const num = lb.querySelector('.lb-n')

  let cur = { photos: [], title: '', i: 0 }
  let lastFocus = null

  const preload = (i) => { if (i >= 0 && i < cur.photos.length) { const p = new Image(); p.src = cur.photos[i] } }

  function show(i, dir = 0) {
    const n = cur.photos.length
    cur.i = (i + n) % n
    fig.classList.add('is-swapping')
    const next = new Image()
    next.onload = () => {
      img.src = next.src
      img.alt = `${cur.title}, foto ${cur.i + 1} di ${n}`
      num.textContent = `${cur.i + 1} / ${n}`
      fig.style.setProperty('--dir', dir)
      requestAnimationFrame(() => fig.classList.remove('is-swapping'))
    }
    next.src = cur.photos[cur.i]
    preload(cur.i + 1); preload(cur.i - 1)
  }

  function open(block, i) {
    let photos = []
    try { photos = JSON.parse(block.dataset.photos || '[]') } catch { photos = [] }
    if (!photos.length) return
    cur = { photos, title: block.dataset.title || '', i: 0 }
    title.textContent = cur.title
    lastFocus = document.activeElement
    lb.hidden = false
    requestAnimationFrame(() => lb.classList.add('is-open'))
    window.__lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    show(i)
    lb.querySelector('.lb-close').focus()
  }

  function close() {
    lb.classList.remove('is-open')
    window.__lenis?.start()
    document.documentElement.style.overflow = ''
    setTimeout(() => { lb.hidden = true; img.removeAttribute('src') }, 350)
    lastFocus?.focus?.()
  }

  lb.querySelector('.lb-close').addEventListener('click', close)
  lb.querySelector('.lb-prev').addEventListener('click', () => show(cur.i - 1, -1))
  lb.querySelector('.lb-next').addEventListener('click', () => show(cur.i + 1, 1))
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === fig) close() })
  addEventListener('keydown', (e) => {
    if (lb.hidden) return
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowRight') show(cur.i + 1, 1)
    else if (e.key === 'ArrowLeft') show(cur.i - 1, -1)
  })

  let sx = null
  lb.addEventListener('pointerdown', (e) => { sx = e.clientX })
  lb.addEventListener('pointerup', (e) => {
    if (sx == null) return
    const dx = e.clientX - sx; sx = null
    if (Math.abs(dx) > 48) show(cur.i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1)
  })

  blocks.forEach((block) => {
    block.querySelectorAll('img').forEach((thumb) => {
      const i = Number(thumb.dataset.i ?? 0)
      thumb.setAttribute('role', 'button')
      thumb.setAttribute('tabindex', '0')
      thumb.setAttribute('aria-label', `Apri la galleria: ${block.dataset.title}`)
      thumb.addEventListener('click', () => open(block, i))
      thumb.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(block, i) } })
    })
    const btn = document.querySelector(`[data-gallery-open="${block.dataset.gallery}"]`)
    btn?.addEventListener('click', () => open(block, 0))
  })
}
