// Motore di scroll — SOLO qui si inizializza Lenis e lo si integra con GSAP.
// Pattern canonico della skill: UN solo ticker (GSAP), Lenis dentro il ticker,
// ScrollTrigger aggiornato dagli eventi Lenis, lagSmoothing disattivato.

import { state } from './state.js'

export let lenis = null

export function initScroll() {
  gsap.registerPlugin(ScrollTrigger)

  if (state.reduced) {
    // niente smooth scroll, niente scrub: la pagina è statica e leggibile
    addEventListener('scroll', () => { state.scrollY = window.scrollY }, { passive: true })
    return null
  }

  lenis = new Lenis({ lerp: 0.09, smoothWheel: true })

  lenis.on('scroll', (l) => {
    state.scrollY = l.scroll ?? window.scrollY
    state.progress = l.progress || 0
    ScrollTrigger.update()
  })

  // rete di sicurezza: Lenis scrolla la finestra nativa, tienila come verità
  addEventListener('scroll', () => { state.scrollY = window.scrollY }, { passive: true })

  // scrub deterministico nei test (vedi qa-checklist della skill)
  window.__lenis = lenis

  gsap.ticker.add((time) => { lenis.raf(time * 1000) })
  gsap.ticker.lagSmoothing(0)

  // link interni via Lenis
  document.querySelectorAll('[data-scroll-to]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.dataset.scrollTo)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { duration: 2.2, easing: (u) => 1 - Math.pow(1 - u, 3) })
    })
  })

  return lenis
}
