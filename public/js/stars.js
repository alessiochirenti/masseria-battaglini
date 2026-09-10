// Cielo delle sottopagine: stelle che respirano sul gradiente dell'ora blu.
// Canvas 2D leggero, un solo disegno per frame dentro il ticker GSAP (nessun rAF a parte).
// Con prefers-reduced-motion il cielo è disegnato una volta e resta fermo.
import { state } from './state.js'

export function initStars() {
  const c = document.createElement('canvas')
  c.className = 'stars'
  c.setAttribute('aria-hidden', 'true')
  const sky = document.querySelector('.sky-static')
  if (!sky) return
  sky.after(c)
  const ctx = c.getContext('2d')
  let stars = []
  let w = 0, h = 0, dpr = 1

  function seed() {
    dpr = Math.min(devicePixelRatio || 1, 2)
    w = innerWidth; h = innerHeight
    c.width = w * dpr; c.height = h * dpr
    c.style.width = w + 'px'; c.style.height = h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const n = Math.round((w * h) / 9000)
    stars = Array.from({ length: n }, () => {
      const y = Math.pow(Math.random(), 1.6) * h * 0.7 // più fitte in alto
      return { x: Math.random() * w, y, r: 0.4 + Math.random() * 1.1, a: 0.25 + Math.random() * 0.6, ph: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 0.9 }
    })
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h)
    for (const s of stars) {
      const tw = 0.65 + 0.35 * Math.sin(t * s.sp + s.ph)
      const fade = 1 - s.y / (h * 0.7) // le stelle svaniscono verso l'orizzonte
      ctx.globalAlpha = s.a * tw * (0.35 + 0.65 * fade)
      ctx.fillStyle = '#f2edde'
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  seed()
  addEventListener('resize', () => { seed(); draw(0) }, { passive: true })
  if (state.reduced) { draw(0); return }
  let last = 0
  gsap.ticker.add((t) => {
    if (t - last < 1 / 30) return // 30 fps bastano per un tremolio
    last = t
    draw(t)
  })
}
