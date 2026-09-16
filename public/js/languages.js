const root = document.querySelector('[data-languages]')
if (root) {
  const summary = root.querySelector('summary')
  const close = (focus = false) => { root.open = false; if (focus) summary.focus() }
  document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close() })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && root.open) { event.preventDefault(); event.stopImmediatePropagation(); close(true) }
  }, true)
  root.addEventListener('focusout', event => { if (event.relatedTarget && !root.contains(event.relatedTarget)) close() })
  root.querySelectorAll('a[hreflang]').forEach(link => {
    if (location.hash) link.hash = location.hash
    link.addEventListener('click', () => {
      const section = [...document.querySelectorAll('main section[id], main article[id], main .guestbook[id]')].filter(s => s.getBoundingClientRect().top <= innerHeight * .35).at(-1)
      link.hash = scrollY > 200 && section ? section.id : location.hash
    })
  })
  addEventListener('pagehide', () => close())
}
