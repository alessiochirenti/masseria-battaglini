/**
 * Demand-driven rendering for the locally patched StPageFlip 2.0.7.
 * Attach before loadFromHTML(): the optional vendor hook replaces its endless RAF.
 * GSAP and native RAF both use performance.now(), including after long idle periods.
 */
export function attachGuestbookRenderer(flip, stage) {
  let renderer = null
  let originalStartAnimation = null
  let wrappedStartAnimation = null
  let ticker = null
  let raf = null
  let dirty = true
  let needsLayout = true
  let inViewport = false
  let pointerActive = false
  let disposed = false
  let pausedAt = performance.now()
  const now = () => performance.now()
  const visible = () => inViewport && !document.hidden

  function unschedule() {
    if (ticker) { ticker.remove(frame); ticker = null }
    if (raf !== null) { cancelAnimationFrame(raf); raf = null }
  }

  function pause() {
    if (pausedAt === null) pausedAt = now()
    unschedule()
  }

  function resume() {
    if (pausedAt === null || !renderer) return
    const time = now()
    // Freeze an in-flight turn while hidden, instead of skipping it on return.
    if (renderer.animation) renderer.animation.startedAt += time - pausedAt
    renderer.timer = time
    pausedAt = null
  }

  function schedule() {
    if (disposed || !renderer) return
    if (!visible()) { pause(); return }
    resume()
    if ((!dirty && !renderer.animation) || ticker || raf !== null) return
    const sharedTicker = window.gsap?.ticker
    if (sharedTicker?.add && sharedTicker?.remove) {
      ticker = sharedTicker
      ticker.add(frame)
    } else raf = requestAnimationFrame(frame)
  }

  function invalidate() {
    if (disposed) return
    dirty = true
    schedule()
  }

  function frame() {
    // A native RAF is one-shot; GSAP keeps this callback until unschedule().
    raf = null
    if (disposed || !visible()) { pause(); return }
    resume()
    if (!dirty && !renderer.animation) { unschedule(); return }
    dirty = false
    if (needsLayout) {
      needsLayout = false
      flip.update()
    }
    renderer.render(now())
    if (!dirty && !renderer.animation) unschedule()
    else schedule()
  }

  const driver = (render) => {
    renderer = render
    originalStartAnimation = render.startAnimation
    wrappedStartAnimation = function (...args) {
      // StPageFlip derives startedAt from its last render.timer. Refresh it before
      // creating an animation, otherwise the first flip after idle ends instantly.
      const time = now()
      this.timer = time
      if (!visible()) pausedAt = time
      const result = originalStartAnimation.apply(this, args)
      invalidate()
      return result
    }
    render.startAnimation = wrappedStartAnimation
    invalidate()
  }
  flip.guestbookRenderDriver = driver

  // turnToPage()/reduced-motion updates also emit flip; no animation is required.
  for (const name of ['init', 'flip', 'update', 'changeOrientation', 'changeState']) {
    flip.on(name, invalidate)
  }

  const observer = new IntersectionObserver(entries => {
    inViewport = entries.some(entry => entry.isIntersecting)
    if (visible()) invalidate()
    else pause()
  }, { rootMargin: '180px' })
  observer.observe(stage)

  const resized = () => { needsLayout = true; invalidate() }
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resized) : null
  resizeObserver?.observe(stage)
  window.addEventListener('resize', resized, { passive: true })

  const visibilityChanged = () => { if (visible()) invalidate(); else pause() }
  document.addEventListener('visibilitychange', visibilityChanged)
  window.addEventListener('pagehide', pause)
  window.addEventListener('pageshow', visibilityChanged)

  // Dragging updates geometry without emitting a state event for every movement.
  // Coalesce those changes into one render and stop again when the pointer rests.
  const pointerDown = () => { pointerActive = true; invalidate() }
  const pointerMove = event => {
    if (pointerActive || stage.contains(event.target)) invalidate()
  }
  const pointerEnd = () => {
    if (!pointerActive) return
    pointerActive = false
    invalidate()
  }
  stage.addEventListener('pointerdown', pointerDown, { passive: true })
  window.addEventListener('pointermove', pointerMove, { passive: true })
  window.addEventListener('pointerup', pointerEnd, { passive: true })
  window.addEventListener('pointercancel', pointerEnd, { passive: true })

  return {
    invalidate,
    destroy() {
      disposed = true
      unschedule()
      observer.disconnect()
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resized)
      document.removeEventListener('visibilitychange', visibilityChanged)
      window.removeEventListener('pagehide', pause)
      window.removeEventListener('pageshow', visibilityChanged)
      stage.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerup', pointerEnd)
      window.removeEventListener('pointercancel', pointerEnd)
      if (renderer?.startAnimation === wrappedStartAnimation) renderer.startAnimation = originalStartAnimation
      if (flip.guestbookRenderDriver === driver) delete flip.guestbookRenderDriver
      // Vendor off(name) removes every subscriber. Keep our inert callbacks so
      // destroying this adapter never removes the host's navigation listeners.
    },
  }
}
