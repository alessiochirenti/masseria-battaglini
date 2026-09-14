// One scroll-driven botanical shot: physical surfaces -> violet light.
// The mesh erosion and particle birth use the exact same spatial field.
import * as THREE from 'three'
import { state } from './state.js'
import { prepareBotanicalSurface, createLilacDepthMaterial, loadPetalAlbedo } from './lilac-materials.js'

const BEAT = { appear: [0.015, 0.19], words: [0.03, 0.17], wordsOut: [0.43, 0.60], evaporate: [0.47, 0.85], clear: [0.82, 0.99] }
const clamp = (v) => Math.max(0, Math.min(1, v))
const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x) }
let shot

const erosion = /* glsl */`
  uniform float uErode;
  uniform vec2 uBounds;
  float lilacField(vec3 p) {
    float height = clamp((p.y - uBounds.x) / max(uBounds.y, .01), 0., 1.);
    float large = sin(p.x * 5.7 + sin(p.y * 4.3 + p.z * 3.8)) * .13;
    float fine = sin(p.x * 37.1 + p.y * 23.3 + p.z * 29.7) * .07;
    return clamp(.17 + (1. - height) * .64 + large + fine, .025, .975);
  }
`

function erodingMaterial(material, uniforms) {
  const previous = material.onBeforeCompile
  const previousKey = material.customProgramCacheKey()
  material.onBeforeCompile = (shader, renderer) => {
    previous?.call(material, shader, renderer)
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLilacPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLilacPosition = position;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vLilacPosition;\n${erosion}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float erosionDistance = 1.;
        if (uErode > 0.) erosionDistance = lilacField(vLilacPosition) - uErode;
        if (erosionDistance < 0.0) discard;
      `)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rim = (1. - smoothstep(0., .022, erosionDistance)) * step(.005, uErode);
        totalEmissiveRadiance += vec3(.36, .09, .66) * rim * .65;
      `)
  }
  material.customProgramCacheKey = () => `${previousKey}-erosion-v2`
  material.needsUpdate = true
}

function loadModel(mobile) {
  return new Promise((resolve,reject)=>{
    const worker = new Worker(new URL('./lilac-worker.js',import.meta.url),{type:'module'})
    const timer = setTimeout(()=>{worker.terminate();reject(new Error('Tempo di costruzione del lillà scaduto.'))},15000)
    const finish=()=>{clearTimeout(timer);worker.terminate();if(shot)shot.worker=null}
    shot.worker=worker
    worker.onerror=(error)=>{finish();reject(new Error(error.message))}
    worker.onmessage=({data})=>{
      finish()
      if(data.error){reject(new Error(data.error));return}
      const group=new THREE.Group(),loader=new THREE.MaterialLoader()
      const surfaces=data.parts.map(part=>{
        const geometry=new THREE.BufferGeometry()
        for(const [name,a] of Object.entries(part.attributes))geometry.setAttribute(name,new THREE.BufferAttribute(a.array,a.itemSize,a.normalized))
        if(part.index)geometry.setIndex(new THREE.BufferAttribute(part.index,1))
        const mesh=new THREE.Mesh(geometry,loader.parse(part.material));mesh.name=part.name;group.add(mesh);return mesh
      })
      resolve({group,surfaces,counts:data.counts,samples:data.samples})
    }
    const imports=JSON.parse(document.querySelector('script[type="importmap"]').textContent).imports
    worker.postMessage({threeUrl:new URL(imports.three,location.href).href,detail:mobile ? .72 : 1,particleCount:mobile?11000:18000})
  })
}

function particles(samples, uniforms) {
  const { positions, seeds } = samples
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: /* glsl */`
      attribute vec4 aSeed;
      uniform float uDpr, uClear;
      varying float vAlpha;
      varying vec3 vTint;
      ${erosion}
      void main() {
        float distance = uErode - lilacField(position);
        float age = max(0., distance) * 1.65;
        float rise = age * age;
        vec3 p = position;
        // A seeded rising eddy, evaluated from scroll only: exact on reversal.
        float phase = aSeed.x * 6.28318;
        p.x += (sin(phase + age * 3.4) - sin(phase)) * age * .60 + (aSeed.y - .32) * rise * 3.8;
        p.y += age * (.35 + aSeed.z * 1.1) + rise * 2.8;
        p.z += (cos(phase + age * 2.8) - cos(phase)) * age * .45 + (aSeed.w - .5) * rise * 2.1;
        vAlpha = smoothstep(0., .045, distance) * (1. - smoothstep(.50, 1.4, age)) * (1. - uClear);
        vAlpha *= .50 + .75 * aSeed.z;
        vTint = mix(vec3(.48,.17,.95), vec3(.84,.55,1.), aSeed.w);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((2.6 + 3.1 * aSeed.z) * uDpr * 7. / max(3., -mv.z), 1., 16.);
      }
    `,
    fragmentShader: /* glsl */`
      varying float vAlpha; varying vec3 vTint;
      void main() {
        float d = length(gl_PointCoord - .5);
        float glow = exp(-d * d * 22.);
        float core = 1. - smoothstep(.05, .23, d);
        float alpha = (glow * .52 + core * .48) * vAlpha;
        if (alpha < .008) discard;
        gl_FragColor = vec4(vTint, alpha);
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 2
  return points
}

export function initLilac() {
  const section = document.getElementById('alba'), canvas = document.getElementById('lilac-canvas')
  if (!section || !canvas) return
  const stage = section.querySelector('.stage'), words = section.querySelector('.station-text'), spans = words.querySelectorAll('.st-in')
  shot = { section, stage, canvas, words, spans, fallback: section.querySelector('.lilac-fallback'), progress: state.reduced ? .3 : 0, ready: false, active: state.reduced, resized: true }
  if (!state.reduced) {
    ScrollTrigger.create({
      id: 'lilac-shot', trigger: section, start: 'top top',
      end: () => `+=${Math.max(1, section.offsetHeight - stage.offsetHeight)}`,
      onUpdate: (self) => { shot.progress = self.progress; shot.active = self.isActive },
      onToggle: (self) => { shot.active = self.isActive },
      onRefresh: (self) => { shot.progress = self.progress; shot.active = self.isActive; shot.resized = true },
    })
  }
  const resize = new ResizeObserver(() => { shot.resized = true; if (state.reduced && shot.ready) updateLilac(0, 16) })
  resize.observe(stage)
  const build = async () => {
    try {
      const mobile = innerWidth < 721
      const model = await loadModel(mobile)
      shot.model = model
      const albedo = await loadPetalAlbedo().catch(() => null)
      shot.albedo = albedo
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
      shot.renderer = renderer
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
      renderer.shadowMap.enabled = !model.counts.bakedOcclusion
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.shadowMap.autoUpdate = false
      renderer.shadowMap.needsUpdate = true
      const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .1, 40)
      camera.position.set(0, 0, 8)
      const bounds = new THREE.Box3().setFromObject(model.group)
      const uniforms = { uErode: { value: -.12 }, uBounds: { value: new THREE.Vector2(bounds.min.y, bounds.max.y - bounds.min.y) }, uDpr: { value: renderer.getPixelRatio() }, uClear: { value: 0 } }
      const depthMaterial = createLilacDepthMaterial(uniforms, erosion)
      shot.depthMaterial = depthMaterial
      for (const mesh of model.surfaces) {
        prepareBotanicalSurface(mesh, albedo, {bakedOcclusion: model.counts.bakedOcclusion, erosionUniform: uniforms.uErode})
        erodingMaterial(mesh.material, uniforms)
        mesh.customDepthMaterial = depthMaterial
      }
      const dust = particles(model.samples, uniforms)
      shot.dust = dust
      const rig = new THREE.Group(); rig.add(model.group, dust); scene.add(rig)
      const ambient = new THREE.HemisphereLight('#f2eff7', '#877c92', 1.0); scene.add(ambient)
      const key = new THREE.DirectionalLight('#fff5eb', 2.4); key.position.set(-3, 5, 6); scene.add(key)
      key.castShadow = !model.counts.bakedOcclusion
      key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048)
      Object.assign(key.shadow.camera, { left: -2.2, right: 2.2, top: 2.3, bottom: -2.3, near: .5, far: 16 })
      key.shadow.camera.updateProjectionMatrix()
      key.shadow.normalBias = .0035
      key.shadow.bias = -.00006
      const fill = new THREE.DirectionalLight('#eeedfa', .45); fill.position.set(4, 1, 3); scene.add(fill)
      const rim = new THREE.DirectionalLight('#f0eaff', .85); rim.position.set(-2, 3, -4); scene.add(rim)
      Object.assign(shot, { renderer, scene, camera, model, bounds, rig, uniforms, dust, mobile, depthMaterial, lights: {ambient,key,fill,rim}, dpr: renderer.getPixelRatio(), frameMs: 16, frames: 0, lastDraw: -1 })
      fit()
      await (renderer.compileAsync?.(scene, camera) ?? renderer.compile(scene, camera))
      // Warm the custom shadow shader too, while this canvas is still hidden.
      renderer.render(scene, camera)
      renderer.clear()
      renderer.shadowMap.needsUpdate = true
      shot.ready = true
      section.classList.add('lilac-ready')
      if (state.reduced) updateLilac(0, 16)
      if (new URLSearchParams(location.search).has('debug')) {
        window.__lilac = { shot, setProgress: (p) => { shot.progress = clamp(p); shot.active = true; updateLilac(0,16) } }
      }
    } catch (error) {
      disposeGraphics()
      section.classList.add('lilac-unavailable')
      console.warn('Il lillà 3D usa la versione statica di riserva.', error)
    }
  }
  // DOM paints first. Geometry and shader compilation run before this section.
  if ('requestIdleCallback' in window) requestIdleCallback(build, { timeout: 1000 })
  else setTimeout(build, 80)
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); shot.ready = false; section.classList.remove('lilac-ready') })
  // Three registers its own restore handler after our asynchronous build.
  // Wait one task so its renderer state is restored before the static redraw.
  canvas.addEventListener('webglcontextrestored', () => setTimeout(() => {
    if (!shot.renderer || !shot.scene) return
    shot.ready = true; shot.resized = true; shot.lastDraw = -1
    shot.renderer.shadowMap.needsUpdate = true
    section.classList.add('lilac-ready')
    updateLilac(0,16)
  }, 0))
  addEventListener('pagehide', (event) => {
    if (event.persisted) return
    resize.disconnect()
    shot.worker?.terminate()
    disposeGraphics()
  })
}

function disposeGraphics() {
  shot.ready = false
  shot.model?.surfaces.forEach(mesh=>{mesh.geometry.dispose();mesh.material.dispose()})
  shot.dust?.geometry.dispose()
  shot.dust?.material.dispose()
  shot.depthMaterial?.dispose()
  shot.albedo?.dispose()
  shot.lights?.key.shadow.dispose()
  shot.renderer?.dispose()
  shot.renderer = null; shot.scene = null; shot.model = null
  shot.dust = null; shot.depthMaterial = null; shot.lights = null
  shot.albedo = null
}

function fit() {
  const { renderer, camera, stage } = shot
  const width = stage.clientWidth, height = stage.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / Math.max(1, height)
  camera.updateProjectionMatrix()
  renderer.shadowMap.needsUpdate = true
  shot.mobile = width < 721
  shot.stacked = shot.mobile || camera.aspect <= .9
  // Reserve the navigation and the lower text band on short portrait screens.
  const specimenHeight = shot.bounds.max.y - shot.bounds.min.y + (shot.bounds.max.x - shot.bounds.min.x) * .18
  shot.flowerScale = Math.min(1.04, (.60 * height - 88) * 5.045 / (height * specimenHeight))
  shot.flowerY = 1.009 - 226.9 / height
  shot.lastDraw = -1
  shot.resized = false
}

export function updateLilac(time, dtMs = 16) {
  if (!shot) return
  const p = shot.progress
  const alpha = state.reduced ? 1 : smooth(...BEAT.words, p) * (1 - smooth(...BEAT.wordsOut, p))
  shot.words.style.opacity = String(alpha)
  shot.words.style.transform = state.reduced ? '' : `translate3d(0, ${((1 - smooth(...BEAT.words, p)) * 22 - smooth(...BEAT.wordsOut, p) * 18).toFixed(2)}px, 0)`
  const reveal = state.reduced ? 1 : smooth(...BEAT.appear, p)
  shot.fallback.style.opacity = String(reveal * (state.reduced ? 1 : 1-smooth(...BEAT.evaporate,p)))
  if (!shot.ready) return
  if (shot.resized) fit()
  // Keep the context resident for reverse scrolling, but draw nothing offscreen.
  if (!state.reduced && !shot.active && (p <= 0 || p >= 1)) {
    if (!shot.cleared) { shot.renderer.clear(); shot.cleared = true }
    shot.lastDraw = p
    return
  }
  shot.canvas.style.opacity = String(reveal)
  shot.uniforms.uErode.value = state.reduced ? -.12 : smooth(...BEAT.evaporate, p) * 1.18 - .08
  shot.uniforms.uClear.value = state.reduced ? 0 : smooth(...BEAT.clear, p)
  shot.model.group.visible = shot.uniforms.uErode.value < .975
  shot.dust.visible = !state.reduced && shot.uniforms.uErode.value > .025 && shot.uniforms.uClear.value < 1
  if (!shot.model.group.visible && !shot.dust.visible) {
    if (!shot.cleared) { shot.renderer.clear(); shot.cleared = true }
    shot.lastDraw = p
    return
  }
  if (shot.model.group.visible && shot.lastDraw !== p) shot.renderer.shadowMap.needsUpdate = true
  const halfWidth = 8 * Math.tan(35 * Math.PI / 360) * shot.camera.aspect
  const scale = shot.stacked ? Math.min(shot.flowerScale, halfWidth * .66) : 1.24
  shot.rig.scale.setScalar(scale)
  const lateralPosition = state.reduced ? .52 : .22 + .30 * (1-smooth(.18,.32,p))
  shot.rig.position.set(shot.stacked ? halfWidth * .10 : halfWidth * lateralPosition, shot.stacked ? shot.flowerY - scale * (shot.bounds.min.y + shot.bounds.max.y) * .5 : .05, 0)
  shot.rig.rotation.z = -.16 + (state.reduced ? 0 : p * .07)
  shot.rig.rotation.y = -.10 + (state.reduced ? 0 : (p - .3) * .28)
  // A compact shadow frustum follows the specimen, not the wide page canvas.
  shot.lights.key.position.set(shot.rig.position.x - 3, shot.rig.position.y + 5, shot.rig.position.z + 6)
  shot.lights.key.target.position.copy(shot.rig.position)
  shot.lights.key.target.updateMatrixWorld()
  if (state.fineHover && !state.reduced) {
    const k = 1 - Math.pow(.005, Math.min(dtMs / 1000, 1/30))
    shot.camera.position.x += (state.pointerX * .065 - shot.camera.position.x) * k
    shot.camera.position.y += (state.pointerY * .04 - shot.camera.position.y) * k
    shot.camera.lookAt(0, 0, 0)
  }
  // The botanical scene has no clock-based movement. Once the very small
  // parallax has settled, keep its framebuffer while the sky animates below.
  if (shot.lastDraw === p && Math.abs(shot.camera.position.x - (shot.lastCameraX ?? Infinity)) < .00001 && Math.abs(shot.camera.position.y - (shot.lastCameraY ?? Infinity)) < .00001) return
  // Quality control changes pixel density, never the geometry during scroll.
  if (!state.reduced && dtMs < 100) {
    shot.frameMs += (dtMs - shot.frameMs) * .035
    shot.frames++
    if (shot.frames % 150 === 0 && shot.frameMs > 22 && shot.dpr > 1) {
      shot.dpr = Math.max(1, shot.dpr - .25)
      shot.renderer.setPixelRatio(shot.dpr); shot.uniforms.uDpr.value = shot.dpr; fit()
    }
  }
  shot.renderer.render(shot.scene, shot.camera)
  shot.cleared = false
  shot.lastDraw = p
  shot.lastCameraX = shot.camera.position.x
  shot.lastCameraY = shot.camera.position.y
}
