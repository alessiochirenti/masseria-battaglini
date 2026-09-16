import { t } from './i18n.js'
// Five sourced excerpts, with a seamless loop and user-controlled autoplay.
const root = document.querySelector('.reviews-carousel')
if (root) {
  const track = root.querySelector('.reviews-quotes')
  const viewport = root.querySelector('.reviews-viewport')
  const originals = [...track.children]
  const total = originals.length
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const pause = root.querySelector('.reviews-pause')
  const counter = root.querySelector('.reviews-count')
  let index = 0, step = 0, columns = 2, timer = null, settle = null
  let moving = false, onScreen = false, hovering = false, focused = false
  let userPaused = reduced.matches
  let gesture = null, suppressClickUntil = 0
  originals.slice(0, 2).forEach(slide => track.append(slide.cloneNode(true)))
  const slides = [...track.children]
  root.classList.add('is-ready')
  root.querySelector('.reviews-controls').hidden = false

  function stopTimer() { clearTimeout(timer); timer = null }
  function schedule() {
    stopTimer()
    if (userPaused || reduced.matches || !onScreen || document.hidden || hovering || focused || moving) return
    timer = setTimeout(() => move(1), 6000)
  }
  function expose() {
    slides.forEach((slide, i) => {
      const visible = i >= index && i < index + columns
      slide.inert = !visible
      slide.setAttribute('aria-hidden', String(!visible))
    })
    counter.textContent = `${index % total + 1} / ${total}`
    root.dataset.review = String(index % total)
    pause.textContent = userPaused ? t('Riprendi') : t('Pausa')
    pause.setAttribute('aria-pressed', String(userPaused))
  }
  function place(animate) {
    track.style.transition = animate && !reduced.matches ? '' : 'none'
    track.style.transform = `translateX(${-index * step}px)`
    expose()
  }
  function finish() {
    clearTimeout(settle)
    if (index >= total) { index = 0; place(false) }
    moving = false
    schedule()
  }
  function move(direction) {
    if (moving) return
    stopTimer()
    if (direction < 0 && index === 0) {
      index = total
      place(false)
      // Commit the identical end copies before sliding back into the originals.
      track.getBoundingClientRect()
    }
    index += direction
    moving = true
    place(true)
    if (reduced.matches) finish()
    else settle = setTimeout(finish, 800)
  }
  function resize() {
    clearTimeout(settle)
    moving = false
    index %= total
    const style = getComputedStyle(root)
    columns = Number(style.getPropertyValue('--review-columns')) || 2
    const gap = parseFloat(style.getPropertyValue('--review-gap')) || 0
    step = (viewport.clientWidth + gap) / columns
    place(false)
    schedule()
  }
  root.querySelector('.reviews-next').addEventListener('click', () => move(1))
  root.querySelector('.reviews-prev').addEventListener('click', () => move(-1))
  pause.addEventListener('click', () => { userPaused = !userPaused; expose(); schedule() })
  root.addEventListener('mouseenter', () => { hovering = true; stopTimer() })
  root.addEventListener('mouseleave', () => { hovering = false; schedule() })
  root.addEventListener('focusin', () => { focused = true; stopTimer() })
  root.addEventListener('focusout', event => {
    if (root.contains(event.relatedTarget)) return
    focused = false
    schedule()
  })
  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return
    gesture = { x: event.clientX, y: event.clientY }
    stopTimer()
  }, { passive: true })
  viewport.addEventListener('pointerup', event => {
    if (!gesture) return
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y
    gesture = null
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      suppressClickUntil = performance.now() + 400
      move(dx < 0 ? 1 : -1)
    }
    else schedule()
  }, { passive: true })
  viewport.addEventListener('pointercancel', () => { gesture = null; schedule() }, { passive: true })
  viewport.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation() }
  }, true)
  document.addEventListener('visibilitychange', schedule)
  reduced.addEventListener('change', () => {
    if (reduced.matches) userPaused = true
    resize()
    expose()
  })
  new IntersectionObserver(entries => {
    onScreen = entries.some(entry => entry.isIntersecting)
    schedule()
  }, { threshold: .3 }).observe(root)
  new ResizeObserver(resize).observe(viewport)
  resize()
}
