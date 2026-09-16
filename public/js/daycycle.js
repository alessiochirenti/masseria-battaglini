// Il ciclo del giorno — UNICA fonte di verità per la fase t (0..4)
// e per tutto ciò che ne deriva: palette del cielo, sole/luna, pesi
// di notte/lucciole, colore dell'inchiostro DOM e delle silhouette.
//
// t: 0 = notte (hero) → 1 = alba → 2 = mezzogiorno → 3 = tramonto → 4 = notte (finale)
// Le ancore sono misurate dal layout reale (offset delle sezioni), non hardcodate:
// se le sezioni cambiano altezza, il cielo si riallinea da solo (lezione `at()` della skill).

import { state } from './state.js'

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smooth = (a, b, x) => {
  const u = clamp01((x - a) / Math.max(b - a, 1e-4))
  return u * u * (3 - 2 * u)
}
const lerp = (a, b, u) => a + (b - a) * u

// ---------------------------------------------------------------
// Ancore scroll → t
// ---------------------------------------------------------------

let anchors = [[0, 0], [1, 4]]

function docTop(el) {
  const r = el.getBoundingClientRect()
  return r.top + window.scrollY
}

export function computeAnchors() {
  const $ = (s) => document.querySelector(s)
  const alba = $('#alba')
  const climax = $('#mezzogiorno')
  const strip = $('#esperienze')
  const tramonti = $('#tramonti-foto')
  const notte = $('#notte')
  const vh = innerHeight
  const maxScroll = Math.max(document.documentElement.scrollHeight - vh, 1)

  anchors = [
    [0, 0],
    [docTop(alba), 0],                                   // la notte regge tutto il hero
    [docTop(alba) + alba.offsetHeight - vh, 1.0],        // fine alba = sole sorto
    [docTop(climax), 1.88],                              // mattino che sale
    [docTop(climax) + climax.offsetHeight - vh, 2.14],   // mezzogiorno, quasi fermo
    [docTop(strip) + strip.offsetHeight - vh, 3.0],      // fine esperienze = tramonto pieno
    ...(tramonti ? [[docTop(tramonti) + tramonti.offsetHeight, 3.0]] : []), // pausa al tramonto fino all'ultima foto
    [docTop(notte) + notte.offsetHeight * 0.55, 3.75],   // il buio cala
    [maxScroll, 4],
  ]
}

export function tOf(scrollY) {
  const a = anchors
  if (scrollY <= a[0][0]) return a[0][1]
  for (let i = 1; i < a.length; i++) {
    if (scrollY <= a[i][0]) {
      const [y0, t0] = a[i - 1]
      const [y1, t1] = a[i]
      return lerp(t0, t1, clamp01((scrollY - y0) / Math.max(y1 - y0, 1)))
    }
  }
  return a[a.length - 1][1]
}

// ---------------------------------------------------------------
// Pesi derivati da t
// ---------------------------------------------------------------

// 1 = notte piena (stelle+lucciole), 0 = giorno pieno
export function nightWeight(t) {
  return clamp01(1 - smooth(0.25, 1.05, t) + smooth(2.95, 3.8, t))
}

// finestra del tremolio di calore attorno a mezzogiorno
export function heatWeight(t) {
  return smooth(1.7, 2.0, t) * (1 - smooth(2.15, 2.55, t))
}

// quanto è "giorno" per l'inchiostro DOM (testo scuro sul cielo chiaro)
export function dayInkWeight(t) {
  return smooth(0.85, 1.5, t) * (1 - smooth(2.6, 3.35, t))
}

// ---------------------------------------------------------------
// Palette del cielo — keyframe ogni mezza fase (indice = t * 2)
// [top, mid, orizzonte] — interpolazione RGB lineare: i passaggi
// di tinta vanno CONTROLLATI con keyframe espliciti, non delegati
// all'HSL (lerpHSL di three non fa il wrap della tinta → verdi spuri)
// ---------------------------------------------------------------

export const SKY_KEYS = [
  ['#050817', '#0b1230', '#1c2650'], // 0.0 notte fonda
  ['#0c1030', '#2b2650', '#6b4560'], // 0.5 primo chiarore, viola
  ['#3b3f6e', '#c96f74', '#f7bd85'], // 1.0 alba rosa-pesca
  ['#38699f', '#8fb2d3', '#f0e0c0'], // 1.5 mattino limpido
  ['#2f6fb4', '#71a3d4', '#e9e2cd'], // 2.0 mezzogiorno, calce all'orizzonte
  ['#3a6ba3', '#9fb4cd', '#eed9b0'], // 2.5 pomeriggio dorato
  ['#432f66', '#d4694a', '#ffb35c'], // 3.0 tramonto ambra
  ['#1a1538', '#3a2a55', '#7a4650'], // 3.5 crepuscolo
  ['#050817', '#0b1230', '#1c2650'], // 4.0 notte
]

// ---------------------------------------------------------------
// Sole e luna
// ---------------------------------------------------------------

export function sunState(t) {
  // u: 0 = sorge, 1 = tramonta
  const u = clamp01((t - 0.62) / (3.38 - 0.62))
  const arc = Math.sin(u * Math.PI)
  return {
    x: lerp(0.16, 0.84, u),
    y: 0.10 + arc * 0.58,
    radius: lerp(0.062, 0.034, arc),
    intensity: smooth(0.6, 1.0, t) * (1 - smooth(3.1, 3.5, t)),
    warmth: 1 - arc, // 1 all'orizzonte (ambra), 0 allo zenit (bianco caldo)
  }
}

export function moonState(t) {
  const w = clamp01(1 - smooth(0.15, 0.75, t) + smooth(3.35, 3.9, t))
  const isDawnMoon = t < 2
  return {
    x: isDawnMoon ? 0.80 : 0.26,
    y: isDawnMoon ? 0.74 : 0.62,
    radius: 0.030,
    intensity: w,
  }
}

// ---------------------------------------------------------------
// Inchiostro DOM e silhouette — applicati come CSS custom properties
// ---------------------------------------------------------------

const SIL_BACK_NIGHT = [12, 16, 36]
const SIL_BACK_DAY = [90, 94, 66]
const SIL_FRONT_NIGHT = [6, 8, 18]
const SIL_FRONT_DAY = [58, 61, 42]

let lastInkW = -1

export function applyInk(t) {
  const w = dayInkWeight(t)
  if (Math.abs(w - lastInkW) < 0.01) return
  lastInkW = w
  const mix = (a, b) => a.map((v, i) => Math.round(lerp(v, b[i], w))).join(', ')
  const root = document.documentElement.style
  root.setProperty('--sil-back', `rgb(${mix(SIL_BACK_NIGHT, SIL_BACK_DAY)})`)
  root.setProperty('--sil-front', `rgb(${mix(SIL_FRONT_NIGHT, SIL_FRONT_DAY)})`)
}

// comodo per il boot e per reduced-motion
export function currentT() {
  return tOf(state.scrollY)
}
