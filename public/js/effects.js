// Effetti DOM: reveal, stazioni narrative, climax sweep, filmstrip, magnetic.
// Regole di skill rispettate: scrub secco (`scrub: true`, mai valori numerici
// con Lenis attivo), ease 'none' sugli scrub, stato iniziale dei reveal in CSS.

import { state } from './state.js'

export function initEffects() {
  if (state.reduced) return // la pagina statica è già completa via CSS

  heroEntrance()
  heroScrub()
  station('#alba')
  station('#notte')
  climax()
  filmstrip()
  photoSections()
  reveals()
  magnetic()
}

// --- full-bleed fotografici: parallax interno + didascalia che affiora ---
function photoSections() {
  document.querySelectorAll('.photo-full').forEach((fig) => {
    const img = fig.querySelector('img')
    const caption = fig.querySelector('figcaption')
    gsap.fromTo(img, { yPercent: -9 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
    })
    gsap.fromTo(caption, { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: fig, start: 'top 55%' },
    })
  })
}

// --- apertura: il titolo affiora dalla notte (time-based, al load) ---
function heroEntrance() {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.rl-1', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, delay: 0.35 })
    .to('.rl-2', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2 }, '-=0.75')
    .to('.rl-3', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5 }, '-=0.85')
    .to('.rl-4', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1 }, '-=0.9')
    .to('.rl-5', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0 }, '-=0.6')
}

// --- il primo gesto di scroll muove già qualcosa: il hero sale e si dissolve ---
function heroScrub() {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: true },
  })
  tl.to('.hint', { opacity: 0, ease: 'none', duration: 0.25 }, 0)
    .to('.hero-inner', { yPercent: -22, opacity: 0, ease: 'none', duration: 0.8 }, 0.15)
}

// --- stazioni narrative: la didascalia resta ferma, entra e esce col progress ---
function station(sel) {
  const text = document.querySelector(`${sel} .station-text`)
  const spans = text.querySelectorAll('.st-in')
  gsap.set(spans, { opacity: 0, y: 34 })
  const tl = gsap.timeline({
    scrollTrigger: { trigger: sel, start: 'top top', end: 'bottom bottom', scrub: true },
  })
  tl.to(spans, { opacity: 1, y: 0, ease: 'none', duration: 0.22, stagger: 0.08 }, 0.08)
    .to(text, { opacity: 0, y: -26, ease: 'none', duration: 0.2 }, 0.78)
}

// --- climax: il claim attraversa lo schermo, il glow culmina al centro ---
function climax() {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#mezzogiorno', start: 'top top', end: 'bottom bottom', scrub: true },
  })
  tl.fromTo('.big-claim', { xPercent: 105 }, { xPercent: -105, ease: 'none', duration: 1 }, 0)
    .fromTo('.big-claim', { '--glow': 0 }, { '--glow': 1, ease: 'sine.in', duration: 0.5 }, 0)
    .to('.big-claim', { '--glow': 0, ease: 'sine.out', duration: 0.5 }, 0.5)
    .fromTo('.climax-caption', { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.15 }, 0.3)
    .to('.climax-caption', { opacity: 0, ease: 'none', duration: 0.15 }, 0.75)
}

// --- filmstrip orizzontale scrub-linked ---
function filmstrip() {
  const track = document.querySelector('.track-h')
  gsap.to(track, {
    x: () => -(track.scrollWidth - innerWidth),
    ease: 'none',
    scrollTrigger: {
      trigger: '#esperienze',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
    },
  })
  gsap.fromTo('.strip-head', { opacity: 0, y: 24 }, {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '#esperienze', start: 'top 55%' },
  })
}

// --- reveal di default: fade + rise con stagger gerarchico ---
function reveals() {
  document.querySelectorAll('.s-panel .panel, .cta-inner').forEach((block) => {
    const items = block.querySelectorAll('.reveal')
    gsap.to(items, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.14,
      scrollTrigger: { trigger: block, start: 'top 68%' },
    })
  })
}

// --- CTA magnetico (solo pointer fine, damping fps-independent) ---
function magnetic() {
  if (!state.fineHover) return
  document.querySelectorAll('.magnetic').forEach((btn) => {
    const label = btn.querySelector('span')
    let tx = 0, ty = 0, x = 0, y = 0
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect()
      tx = (e.clientX - r.left - r.width / 2) * 0.3
      ty = (e.clientY - r.top - r.height / 2) * 0.3
    })
    btn.addEventListener('pointerleave', () => { tx = 0; ty = 0 })
    gsap.ticker.add((t, dtMs) => {
      const k = 1 - Math.pow(0.0015, dtMs / 1000)
      x += (tx - x) * k
      y += (ty - y) * k
      if (Math.abs(x) + Math.abs(y) > 0.05) {
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
        if (label) label.style.transform = `translate(${(x * 0.35).toFixed(1)}px, ${(y * 0.35).toFixed(1)}px)`
      }
    })
  })
}
