// Bootstrap — un solo punto d'ingresso, un solo ticker (GSAP).
// Ordine: input → scroll engine → ancore del giorno → scena → effetti DOM.

import { state, initInput } from './state.js'
import { initScroll } from './scroll.js'
import { computeAnchors } from './daycycle.js'
import { initSky, updateSky } from './sky.js'
import { initEffects } from './effects.js'
import { initLilac, updateLilac } from './lilac.js'

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
let skyReady = false
try { initSky(); skyReady = true } catch (error) {
  document.documentElement.classList.add('no-webgl')
  console.warn('Il cielo 3D non è disponibile su questo dispositivo.', error)
}
initEffects()
initLilac()

if (state.reduced) {
  // scena statica all'ora d'oro: un render al load e a ogni resize
  if (skyReady) updateSky()
  addEventListener('resize', () => { if (skyReady) updateSky() }, { passive: true })
} else {
  // il render 3D vive nel ticker GSAP: UN solo rAF in tutto il progetto
  gsap.ticker.add((time, dtMs) => {
    if (!document.hidden) {
      if (skyReady) updateSky()
      updateLilac(time, dtMs)
    }
  })

  // le ancore del ciclo del giorno dipendono dal layout: riallineale
  // quando ScrollTrigger ricalcola (font caricati, resize, refresh)
  ScrollTrigger.addEventListener('refresh', computeAnchors)

  // i font cambiano l'altezza delle sezioni: un refresh quando sono pronti
  document.fonts?.ready.then(() => ScrollTrigger.refresh())
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
