// Bootstrap — un solo punto d'ingresso, un solo ticker (GSAP).
// Ordine: input → scroll engine → ancore del giorno → scena → effetti DOM.

import { state, initInput } from './state.js'
import { initScroll } from './scroll.js'
import { computeAnchors } from './daycycle.js'
import { initSky, updateSky } from './sky.js'
import { initEffects } from './effects.js'

initInput()

// hook di verifica: ?at=0.5 apre la pagina a metà scroll (scrub deterministico nei test)
const AT = parseFloat(new URLSearchParams(location.search).get('at') ?? 'NaN')
if (!Number.isNaN(AT)) {
  history.scrollRestoration = 'manual'
  scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * AT)
  state.scrollY = window.scrollY
}

if (state.reduced) document.documentElement.classList.add('reduced')

initScroll()
computeAnchors()
initSky()
initEffects()

if (state.reduced) {
  // scena statica all'ora d'oro: un render al load e a ogni resize
  updateSky()
  addEventListener('resize', () => requestAnimationFrame(updateSky), { passive: true })
} else {
  // il render 3D vive nel ticker GSAP: UN solo rAF in tutto il progetto
  gsap.ticker.add(() => { updateSky() })

  // le ancore del ciclo del giorno dipendono dal layout: riallineale
  // quando ScrollTrigger ricalcola (font caricati, resize, refresh)
  ScrollTrigger.addEventListener('refresh', computeAnchors)

  // i font cambiano l'altezza delle sezioni: un refresh quando sono pronti
  document.fonts?.ready.then(() => ScrollTrigger.refresh())
}

// menu: barra scura appena si lascia il hero (i pannelli sotto sono chiari)
{
  const nav = document.querySelector('.nav')
  const upd = () => nav.classList.toggle('away', window.scrollY > innerHeight * 0.7)
  addEventListener('scroll', upd, { passive: true })
  upd()
}

// form di contatto: nella demo non invia nulla, mostra solo la conferma
document.querySelectorAll('.contact-form').forEach((f) => {
  f.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!f.checkValidity()) { f.reportValidity(); return }
    f.querySelector('.cf-fields').hidden = true
    f.querySelector('.cf-ok').hidden = false
  })
})

// menu mobile: l'hamburger apre le voci a tutto schermo; i link lo richiudono
{
  const nav = document.querySelector('.nav')
  const burger = nav?.querySelector('.nav-burger')
  const setOpen = (v) => {
    nav.classList.toggle('open', v)
    burger.setAttribute('aria-expanded', String(v))
    burger.setAttribute('aria-label', v ? 'Chiudi il menu' : 'Apri il menu')
    const l = window.__lenis
    if (l) v ? l.stop() : l.start()
    document.documentElement.style.overflow = v ? 'hidden' : ''
  }
  if (burger) {
    burger.addEventListener('click', () => setOpen(!nav.classList.contains('open')))
    nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => setOpen(false)))
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false) })
  }
}
