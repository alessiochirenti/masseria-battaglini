import { t } from './i18n.js'
// Il menu funziona indipendentemente dai motori 3D e di scroll.
const header = document.querySelector('.nav')
const toggle = header?.querySelector('.nav-toggle')
const panel = header?.querySelector('.nav-panel')
if (header && toggle && panel) {
  const mobile = matchMedia('(max-width: 1280px)')
  const label = toggle.querySelector('.nav-toggle-label')
  let open = false
  let previousOverflow = ''
  let stoppedLenis = false
  let background = []
  function setOpen(value, restoreFocus = true) {
    if (open === value) return
    open = value
    header.classList.toggle('open', open)
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? t('Chiudi il menu') : t('Apri il menu'))
    label.textContent = open ? t('Chiudi') : t('Menu')
    if (open) {
      previousOverflow = document.documentElement.style.overflow
      document.documentElement.style.overflow = 'hidden'
      stoppedLenis = Boolean(window.__lenis && !window.__lenis.isStopped)
      if (stoppedLenis) window.__lenis.stop()
      background = [...document.body.children].filter(el => el !== header && !el.contains(header) && !el.inert && !['SCRIPT', 'STYLE'].includes(el.tagName))
      background.forEach(el => { el.inert = true })
      panel.querySelector('a')?.focus({ preventScroll: true })
    } else {
      background.forEach(el => { el.inert = false })
      background = []
      document.documentElement.style.overflow = previousOverflow
      if (stoppedLenis) window.__lenis?.start()
      if (restoreFocus) toggle.focus({ preventScroll: true })
    }
  }
  toggle.addEventListener('click', () => setOpen(!open))
  // La cattura riattiva Lenis prima del gestore delle ancore.
  header.addEventListener('click', event => {
    const link = event.target.closest('a')
    if (link) setOpen(false, link.getAttribute('href').startsWith('#'))
  }, true)
  addEventListener('keydown', event => {
    if (!open) return
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
    if (event.key !== 'Tab') return
    const focusable = [...header.querySelectorAll('a[href], button, summary')].filter(el => el.getClientRects().length)
    const first = focusable[0], last = focusable.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  })
  mobile.addEventListener('change', () => { if (!mobile.matches) setOpen(false, false) })
  addEventListener('pagehide', () => setOpen(false, false))
  const updateTone = () => header.classList.toggle('away', scrollY > 60)
  addEventListener('scroll', updateTone, { passive: true })
  updateTone()
  const currentPage = location.pathname.split('/').pop() || 'index.html'
  header.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.setAttribute('aria-current', 'page')
  })
  header.classList.add('nav-ready')
}
