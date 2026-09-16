// Bootstrap delle sottopagine (racconto, dimore, esperienze).
// Niente ciclo del giorno: cielo fermo all'ora blu con le stelle che respirano,
// e una coreografia di scroll che dà alle pagine "ferme" lo stesso passo della home:
// titoli che affiorano parola per parola, foto che si svelano e scorrono in parallasse,
// stazioni narrative a schermo intero. Solo transform e opacity, scrub secco con Lenis.
import { state, initInput } from './state.js'
import { initScroll } from './scroll.js'
import { initStars } from './stars.js'
import { initGallery } from './gallery.js?v=20260916-i18n'

initInput()
if (state.reduced) document.documentElement.classList.add('reduced')
initScroll()
initStars()
initGallery()

// Spezza un titolo in parole animabili, senza perdere i corsivi (<em>).
function splitWords(el) {
  if (el.dataset.split) return el.querySelectorAll('.w')
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment()
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return }
          const w = document.createElement('span'); w.className = 'w'
          const inner = document.createElement('span'); inner.textContent = part
          w.appendChild(inner); frag.appendChild(w)
        })
        child.replaceWith(frag)
      } else if (child.nodeType === 1) walk(child)
    }
  }
  walk(el)
  el.dataset.split = '1'
  return el.querySelectorAll('.w')
}

if (!state.reduced) {
  // foto d'apertura: parallasse interna + didascalia che affiora
  document.querySelectorAll('.photo-full').forEach((fig) => {
    const img = fig.querySelector('img')
    const caption = fig.querySelector('figcaption')
    gsap.fromTo(img, { yPercent: -9 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
    })
    // il titolo grande sale parola per parola da dietro una riga invisibile
    const em = caption.querySelector('em')
    const inner = em ? (splitWords(em), em.querySelectorAll('.w > span')) : null
    const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 80%' }, delay: 0.15 })
    tl.fromTo(caption, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' })
    if (inner?.length) {
      tl.fromTo(inner, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09 }, 0.1)
    }
  })

  // le foto nei pannelli hanno la didascalia sotto: la parallasse va tagliata da un
  // contenitore tutto suo, altrimenti l'immagine scorrerebbe sopra il testo
  document.querySelectorAll('.panel-photo > img').forEach((img) => {
    const clip = document.createElement('div')
    clip.className = 'ph-clip'
    img.replaceWith(clip)
    clip.appendChild(img)
  })

  // stazioni narrative: la frase resta ferma, entra e esce col progress (come in home)
  // la frase si compone parola per parola mentre si scorre: ogni parola affiora
  // e si mette a fuoco, la frase resta ferma un momento, poi svanisce
  document.querySelectorAll('.s-station').forEach((sec) => {
    const text = sec.querySelector('.station-text')
    const words = splitWords(text)
    gsap.set(words, { opacity: 0, y: 28, filter: 'blur(8px)' })
    // entrata a tempo, come la citazione nei pannelli: parte quando la stazione è sullo schermo
    gsap.to(words, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', stagger: 0.11,
      scrollTrigger: { trigger: sec, start: 'top 45%', toggleActions: 'play none none none' },
    })
    // uscita legata allo scroll: la frase svanisce prima del pannello successivo
    gsap.to(text, {
      opacity: 0, y: -26, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'bottom 130%', end: 'bottom 100%', scrub: true },
    })
  })

  // pannelli: il foglio sale, poi i contenuti in sequenza; i titoli parola per parola
  document.querySelectorAll('.s-panel .panel, .cta-inner').forEach((block) => {
    const items = [...block.querySelectorAll('.reveal')]
    const tl = gsap.timeline({ scrollTrigger: { trigger: block, start: 'top 74%' } })
    if (block.classList.contains('panel')) {
      tl.fromTo(block, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }, 0)
    }
    let at = 0.15
    for (const item of items) {
      if (item.matches('h2, .quote')) {
        const words = splitWords(item)
        gsap.set(item, { opacity: 1, y: 0 })
        tl.fromTo(words, { opacity: 0, y: 22, filter: 'blur(6px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out', stagger: 0.045 }, at)
        at += 0.08 + Math.min(words.length, 12) * 0.02
      } else if (item.classList.contains('feature')) {
        const fig = item.querySelector('figure')
        const img = item.querySelector('img')
        const side = item.classList.contains('flip') ? '0 0 0 100%' : '0 100% 0 0'
        const txt = item.querySelectorAll(':scope > div > *')
        gsap.set(item, { opacity: 1, y: 0 })
        tl.fromTo(fig, { clipPath: `inset(${side})` }, { clipPath: 'inset(0 0% 0 0%)', duration: 1.2, ease: 'power4.inOut' }, at)
          .fromTo(txt, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07 }, at + 0.25)
        if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1.06, duration: 1.6, ease: 'power3.out' }, at)
        at += 0.35
      } else if (item.classList.contains('gal')) {
        const imgs = item.querySelectorAll('img')
        gsap.set(item, { opacity: 1, y: 0 })
        tl.fromTo(imgs, { opacity: 0, y: 36, rotate: 1.2 }, { opacity: 1, y: 0, rotate: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, at)
        at += 0.3
      } else if (item.classList.contains('servizi-grid') || item.classList.contains('jump')) {
        gsap.set(item, { opacity: 1, y: 0 })
        tl.fromTo(item.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07 }, at)
        at += 0.3
      } else {
        tl.to(item, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, at)
        at += 0.12
      }
    }
    // le card servizio dentro un pannello si rivelano una alla volta
    const servs = block.querySelectorAll('.serv.reveal')
    if (servs.length) {
      gsap.set(servs, { opacity: 0, y: 24 })
      tl.to(servs, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07 }, at)
    }
    // chip: piccolo balzo in sequenza
    block.querySelectorAll('.chips').forEach((ul) => {
      gsap.fromTo(ul.children, { opacity: 0, y: 10 }, {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05,
        scrollTrigger: { trigger: ul, start: 'top 88%' },
      })
    })
  })

  // parallasse morbida sulle foto dei blocchi: l'immagine scorre dentro la cornice
  document.querySelectorAll('.feature figure, .panel-photo').forEach((fig) => {
    const img = fig.querySelector('img')
    gsap.fromTo(img, { yPercent: -5 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
    })
  })

  if (state.fineHover) {
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

  document.fonts?.ready.then(() => ScrollTrigger.refresh())
}


// form di richiesta: nella demo non invia nulla, mostra solo la conferma
document.querySelectorAll('.contact-form').forEach((f) => {
  f.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!f.checkValidity()) { f.reportValidity(); return }
    f.querySelector('.cf-fields').hidden = true
    f.querySelector('.cf-ok').hidden = false
    ScrollTrigger.refresh()
  })
})
