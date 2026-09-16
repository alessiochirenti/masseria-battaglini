import { t } from './i18n.js'
// Load only near the viewport; decode/play only while visible. One silent six-second loop.
const preference = matchMedia('(prefers-reduced-motion: reduce)')
for (const video of document.querySelectorAll('video[data-loop-src]')) {
  const button = video.parentElement.querySelector('.video-toggle')
  let visible = false
  let manualPlay = false
  let userPaused = false
  let failed = false
  const restrained = () => preference.matches || navigator.connection?.saveData
  const load = () => {
    if (video.hasAttribute('src')) return
    video.src = video.dataset.loopSrc
    video.load()
  }
  const label = () => {
    button.textContent = video.paused ? t('Riproduci') : t('Pausa')
    button.setAttribute('aria-label', video.paused ? t('Riproduci il video della cooking class') : t('Metti in pausa il video della cooking class'))
  }
  const sync = () => {
    if (failed || !visible || document.hidden || userPaused || (restrained() && !manualPlay)) {
      video.pause()
      return
    }
    load()
    video.muted = true
    video.play().catch(() => { label() })
  }
  button.hidden = false
  video.addEventListener('play', label)
  video.addEventListener('pause', label)
  video.addEventListener('error', () => {
    failed = true
    button.hidden = true
    // Keep the poster readable if the media is unavailable.
    video.removeAttribute('src')
    video.load()
  })
  button.addEventListener('click', () => {
    if (!video.paused) { userPaused = true; manualPlay = false; video.pause() }
    else { userPaused = false; manualPlay = true; visible = true; sync() }
  })
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !restrained()) load()
  }, { rootMargin: '0px' }).observe(video)
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .25
    sync()
  }, { threshold: [0, .25] }).observe(video)
  document.addEventListener('visibilitychange', sync)
  preference.addEventListener('change', () => { manualPlay = false; sync() })
}
