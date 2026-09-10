// Stato condiviso scroll ↔ scena — scritto dagli eventi, letto dal render loop.
// Un solo oggetto piatto: niente sottoscrizioni, niente costi.

export const state = {
  scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
  progress: 0,      // 0..1 sull'intera pagina
  t: 0,             // fase del giorno 0..4 (notte→alba→giorno→tramonto→notte)
  pointerX: 0,      // -1..1
  pointerY: 0,      // -1..1
  reduced: false,
  fineHover: false,
}

export function initInput() {
  state.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  state.fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches

  if (state.fineHover) {
    addEventListener('pointermove', (e) => {
      state.pointerX = (e.clientX / innerWidth) * 2 - 1
      state.pointerY = -(e.clientY / innerHeight) * 2 + 1
    }, { passive: true })
  }
}
