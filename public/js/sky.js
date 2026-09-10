// La scena persistente: cielo (quad fullscreen in shader) + un unico buffer
// di particelle che cambia ruolo lungo il giorno — stelle e lucciole di notte,
// pulviscolo dorato di giorno. Nessun post-processing: il glow è nello shader.

import * as THREE from 'three'
import { state } from './state.js'
import {
  SKY_KEYS, tOf, nightWeight, heatWeight,
  sunState, moonState, applyInk, computeAnchors,
} from './daycycle.js'

const DPR_MAX = 2
const PARTICLE_COUNT = 2000
const CAM_Z = 6
const FOV = 35

// damping fps-independent (regola di skill): base = personalità del moto
const CAM_BASE = 0.0015

// ---------------------------------------------------------------
// Shader: cielo
// ---------------------------------------------------------------

const skyVert = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`

const skyFrag = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uTop, uMid, uHor, uSunCol;
  uniform vec4 uSun;   // x, y, radius, intensity
  uniform vec4 uMoon;  // x, y, radius, intensity
  uniform float uTime, uHeat, uAspect;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // tremolio di calore vicino all'orizzonte, solo a mezzogiorno
    uv.x += sin(uv.y * 90.0 + uTime * 1.6) * 0.0013 * uHeat * smoothstep(0.45, 0.0, uv.y);

    // gradiente a tre quote
    vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.42, uv.y));
    col = mix(col, uTop, smoothstep(0.38, 0.95, uv.y));

    // sole: disco + doppio alone esponenziale
    vec2 sp = vec2((uv.x - uSun.x) * uAspect, uv.y - uSun.y);
    float sd = length(sp);
    float disc = smoothstep(uSun.z, uSun.z * 0.8, sd);
    float glow = exp(-sd * sd / (uSun.z * uSun.z * 34.0)) * 0.55 + exp(-sd * 4.2) * 0.38;
    col += uSunCol * (disc * 1.25 + glow) * uSun.w;

    // foschia calda sull'orizzonte quando il sole è attivo
    col += uSunCol * smoothstep(0.26, 0.0, uv.y) * 0.09 * uSun.w;

    // luna: disco pallido + alone tenue
    vec2 mp = vec2((uv.x - uMoon.x) * uAspect, uv.y - uMoon.y);
    float md = length(mp);
    float mdisc = smoothstep(uMoon.z, uMoon.z * 0.84, md);
    float mglow = exp(-md * 3.6) * 0.22;
    col += vec3(0.93, 0.91, 0.83) * (mdisc * 0.85 + mglow) * uMoon.w;

    // grana leggera anti-banding
    col += (hash(vUv * vec2(917.13, 563.71) + uTime) - 0.5) * 0.02;

    gl_FragColor = vec4(col, 1.0);
  }
`

// ---------------------------------------------------------------
// Shader: particelle (stelle / lucciole / pulviscolo — un solo buffer)
// ---------------------------------------------------------------

const partVert = /* glsl */`
  attribute vec4 aSeed;              // 4 random in [0,1)
  uniform float uTime, uNight, uPixelRatio;
  uniform vec2 uSpread;              // half-width, half-height del mondo visibile
  varying float vAlpha;
  varying vec3 vColor;

  const vec3 STAR = vec3(0.80, 0.85, 1.00);
  const vec3 FIRE = vec3(0.92, 1.00, 0.55);
  const vec3 DUST = vec3(1.00, 0.85, 0.58);

  void main() {
    float low = step(aSeed.w, 0.13);          // 13%: lucciole di notte, pulviscolo basso di giorno
    float x = (aSeed.x * 2.0 - 1.0) * uSpread.x * 1.05;

    // --- ruoli notturni ---
    // stella: alta, ferma, che tremola
    vec3 pStar = vec3(x, mix(0.02, 1.0, aSeed.y) * uSpread.y, 0.0);
    // lucciola: bassa, che vaga tra gli ulivi
    vec3 pFire = vec3(x, mix(-0.95, -0.45, aSeed.y) * uSpread.y, 0.0);
    pFire.x += sin(uTime * (0.22 + aSeed.z * 0.35) + aSeed.y * 43.0) * 0.42;
    pFire.y += sin(uTime * (0.17 + aSeed.x * 0.28) + aSeed.z * 31.0) * 0.24;
    vec3 pNight = mix(pStar, pFire, low);

    // --- ruolo diurno: pulviscolo dorato che deriva (3 sin sfasati, frequenze non multiple) ---
    vec3 pDay = vec3(x, mix(-0.95, 0.75, fract(aSeed.y + aSeed.z)) * uSpread.y, 0.0);
    pDay.x += sin(uTime * 0.43 + aSeed.z * 40.0) * 0.16;
    pDay.y += sin(uTime * 0.57 + aSeed.x * 36.0) * 0.11 + cos(uTime * 0.31 + aSeed.y * 27.0) * 0.07;

    vec3 pos = mix(pDay, pNight, uNight);

    // --- alpha ---
    // stelle: gerarchia di luminosità (molte deboli, poche vive) + tremolio
    float starBase = 0.18 + 0.82 * pow(aSeed.z, 3.0);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + aSeed.z * 1.6) + aSeed.x * 51.0);
    // lucciole: quasi sempre spente, lampi rari e morbidi
    float blink = pow(0.5 + 0.5 * sin(uTime * (0.45 + aSeed.z * 0.6) + aSeed.y * 77.0), 6.0);
    float aNight = mix(0.9 * twinkle * starBase, 1.6 * blink, low);
    float drift = 0.6 + 0.4 * sin(uTime * 0.5 + aSeed.x * 60.0);
    float aDay = mix(0.08, 0.30, low) * drift;
    vAlpha = mix(aDay, aNight, uNight);

    // --- colore ---
    vec3 cNight = mix(STAR, FIRE, low);
    vColor = mix(DUST, cNight, uNight);

    // --- dimensione ---
    float sNight = mix(1.2 + aSeed.z * 1.9, 3.5 + aSeed.z * 2.0, low);
    float sDay = mix(1.6, 2.6, low) + aSeed.z;
    float size = mix(sDay, sNight, uNight);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = min(size * uPixelRatio, 64.0);
  }
`

const partFrag = /* glsl */`
  precision highp float;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.42, 0.24, d);
    float halo = smoothstep(0.5, 0.0, d) * 0.35;
    float a = (core + halo) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`

// ---------------------------------------------------------------

let renderer, scene, camera, clock
let skyUniforms, partUniforms
let resizePending = false

const cTop = new THREE.Color()
const cMid = new THREE.Color()
const cHor = new THREE.Color()
const cSun = new THREE.Color()
const cSunHor = new THREE.Color('#ffb36b')
const cSunZen = new THREE.Color('#fff6e2')
const KEYS = SKY_KEYS.map((k) => k.map((hex) => new THREE.Color(hex)))

function lerpPalette(t) {
  const x = t * 2 // keyframe ogni mezza fase
  const i = Math.min(Math.floor(x), KEYS.length - 2)
  const f = Math.min(Math.max(x - i, 0), 1)
  cTop.copy(KEYS[i][0]).lerp(KEYS[i + 1][0], f)
  cMid.copy(KEYS[i][1]).lerp(KEYS[i + 1][1], f)
  cHor.copy(KEYS[i][2]).lerp(KEYS[i + 1][2], f)
}

function worldSpread() {
  const halfH = CAM_Z * Math.tan((FOV * Math.PI) / 360)
  return { x: halfH * (innerWidth / innerHeight), y: halfH }
}

export function initSky() {
  const canvas = document.getElementById('gl')
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, DPR_MAX))
  renderer.setSize(innerWidth, innerHeight)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 50)
  camera.position.set(0, 0, CAM_Z)
  clock = new THREE.Clock()

  // --- cielo ---
  skyUniforms = {
    uTop: { value: new THREE.Color() },
    uMid: { value: new THREE.Color() },
    uHor: { value: new THREE.Color() },
    uSun: { value: new THREE.Vector4(0.5, -0.2, 0.05, 0) },
    uSunCol: { value: new THREE.Color('#ffb36b') },
    uMoon: { value: new THREE.Vector4(0.72, 0.68, 0.03, 1) },
    uTime: { value: 0 },
    uHeat: { value: 0 },
    uAspect: { value: innerWidth / innerHeight },
  }
  const skyMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      uniforms: skyUniforms,
      depthWrite: false,
      depthTest: false,
    })
  )
  skyMesh.frustumCulled = false
  skyMesh.renderOrder = -1
  scene.add(skyMesh)

  // --- particelle ---
  const spread = worldSpread()
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3) // calcolate nel vertex shader
  const seeds = new Float32Array(PARTICLE_COUNT * 4)
  for (let i = 0; i < PARTICLE_COUNT * 4; i++) seeds[i] = Math.random()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))

  partUniforms = {
    uTime: { value: 0 },
    uNight: { value: 1 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uSpread: { value: new THREE.Vector2(spread.x, spread.y) },
  }
  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      vertexShader: partVert,
      fragmentShader: partFrag,
      uniforms: partUniforms,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
  )
  points.frustumCulled = false
  scene.add(points)

  // warm-up: compila gli shader ora, non al primo scroll
  renderer.compile(scene, camera)

  addEventListener('resize', () => { resizePending = true }, { passive: true })
}

function applyResize() {
  resizePending = false
  renderer.setPixelRatio(Math.min(devicePixelRatio, DPR_MAX))
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  skyUniforms.uAspect.value = camera.aspect
  partUniforms.uPixelRatio.value = renderer.getPixelRatio()
  const spread = worldSpread()
  partUniforms.uSpread.value.set(spread.x, spread.y)
  computeAnchors()
}

export function updateSky() {
  const dt = Math.min(clock.getDelta(), 1 / 30) // clamp: dopo un tab-switch il delta esplode
  if (resizePending) applyResize()

  const t = state.reduced ? 3.05 : tOf(state.scrollY)
  state.t = t

  // palette
  lerpPalette(t)
  skyUniforms.uTop.value.copy(cTop)
  skyUniforms.uMid.value.copy(cMid)
  skyUniforms.uHor.value.copy(cHor)

  // sole
  const sun = sunState(t)
  skyUniforms.uSun.value.set(sun.x, sun.y, sun.radius, sun.intensity)
  cSun.copy(cSunZen).lerp(cSunHor, sun.warmth)
  skyUniforms.uSunCol.value.copy(cSun)

  // luna
  const moon = moonState(t)
  skyUniforms.uMoon.value.set(moon.x, moon.y, moon.radius, moon.intensity)

  // tempo, calore, notte
  if (!state.reduced) {
    skyUniforms.uTime.value += dt
    partUniforms.uTime.value += dt
  }
  skyUniforms.uHeat.value = heatWeight(t)
  partUniforms.uNight.value = nightWeight(t)

  // parallax mouse fps-independent (ricetta VALIDATA)
  if (state.fineHover && !state.reduced) {
    const k = 1 - Math.pow(CAM_BASE, dt)
    camera.position.x += (state.pointerX * 0.18 - camera.position.x) * k
    camera.position.y += (state.pointerY * 0.10 - camera.position.y) * k
    camera.lookAt(0, 0, 0)
  }

  // inchiostro DOM e silhouette seguono la luce
  applyInk(t)

  renderer.render(scene, camera)
}
