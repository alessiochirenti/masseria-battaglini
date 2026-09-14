import * as THREE from 'three'

// Fine surface response belongs to the living tissue, not to a screen overlay.
// All detail is evaluated in the local petal UVs and survives reverse scroll.
const tissue = /* glsl */`
  varying vec2 vTissueUv;
  varying float vTissueOcclusion;
  float tissueHash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float tissueNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3. - 2. * f);
    return mix(mix(tissueHash(i), tissueHash(i + vec2(1.,0.)), u.x),
      mix(tissueHash(i + vec2(0.,1.)), tissueHash(i + vec2(1.,1.)), u.x), u.y);
  }
`

export async function loadPetalAlbedo() {
  const texture = await new THREE.TextureLoader().loadAsync(new URL('../uploads/lilla-petali-albedo.webp', import.meta.url).href)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function prepareBotanicalSurface(mesh, albedo, {bakedOcclusion = false, erosionUniform = {value: -.12}} = {}) {
  const material = mesh.material
  const petals = material.userData.sss === true || /corollas/i.test(mesh.name)
  if (!mesh.geometry.hasAttribute('aOcclusion')) {
    const ao = new Float32Array(mesh.geometry.attributes.position.count).fill(1)
    mesh.geometry.setAttribute('aOcclusion', new THREE.BufferAttribute(ao, 1))
  }
  if (!mesh.geometry.hasAttribute('uv')) {
    mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(mesh.geometry.attributes.position.count * 2), 2))
  }
  if (!mesh.geometry.hasAttribute('aPetalVariant')) {
    mesh.geometry.setAttribute('aPetalVariant', new THREE.BufferAttribute(new Float32Array(mesh.geometry.attributes.position.count), 1))
  }
  material.dithering = true
  // Petals, buds and stems are closed volumes with outward normals.
  // Back-face culling removes hidden raster work without changing their shape.
  material.side = /throats/i.test(mesh.name) ? THREE.DoubleSide : THREE.FrontSide
  material.shadowSide = THREE.BackSide
  material.roughness = petals ? .76 : .86
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTissueErode = erosionUniform
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aOcclusion;\nattribute float aPetalVariant;\nvarying vec2 vTissueUv;\nvarying float vPetalVariant;\nvarying float vTissueOcclusion;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTissueUv = uv;\nvPetalVariant = aPetalVariant;\nvTissueOcclusion = aOcclusion;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTissueErode;\n${tissue}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float tissueGrain = tissueNoise(vTissueUv * vec2(47., 71.));
        float tissueMottle = tissueNoise(vTissueUv * vec2(7., 11.));
        diffuseColor.rgb *= .982 + .027 * tissueMottle + .005 * tissueGrain;
      `)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (tissueGrain - .5) * .10, .65, .95);
      `)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        float tissueAO = clamp(vTissueOcclusion, .16, 1.);
        ${bakedOcclusion ? 'tissueAO = mix(tissueAO, 1., smoothstep(.08, .90, uTissueErode));' : ''}
        reflectedLight.indirectDiffuse *= .32 + .68 * tissueAO;
        reflectedLight.directDiffuse *= mix(${bakedOcclusion ? '.40' : '.78'}, 1., tissueAO);
        reflectedLight.indirectSpecular *= sqrt(tissueAO);
      `)
    if (petals) {
      // Thin petal tissue admits a little diffuse light even under another
      // lobe. Keep the cast/contact shadow, without the opaque black of metal.
      shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>',
        THREE.ShaderChunk.shadowmap_pars_fragment.replace('return shadow;', 'return mix(.08, 1., shadow);'))
      if (albedo) {
        shader.uniforms.uPetalAlbedo = {value: albedo}
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform sampler2D uPetalAlbedo;\nvarying float vPetalVariant;')
          .replace('float tissueGrain =', `
            vec2 observedUv = vec2((floor(vPetalVariant + .5) + mix(.012, .988, vTissueUv.x)) * .25, mix(.012, .988, vTissueUv.y));
            vec3 observedPigment = texture2D(uPetalAlbedo, observedUv).rgb;
            vec3 ageTint = mix(vec3(1.), clamp(diffuseColor.rgb / vec3(.28, .18, .48), vec3(.65), vec3(1.22)), .22);
            diffuseColor.rgb = mix(diffuseColor.rgb, observedPigment * ageTint, .76);
            float paleMargin = smoothstep(.82, 1., abs(vTissueUv.y * 2. - 1.)) * sin(vTissueUv.x * 3.14159);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.60, .49, .76), paleMargin * .32);
            float tissueGrain =`)
      }
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          // Microscopic relief is filtered out before it can shimmer on mobile.
          float uvFootprint = max(length(dFdx(vTissueUv)), length(dFdy(vTissueUv)));
          float longitudinal = sin(vTissueUv.y * 48. + vTissueUv.x * 7. + tissueMottle * 4.);
          float relief = ((tissueGrain - .5) * .000038 + longitudinal * .000064) * (1. - smoothstep(.022, .075, uvFootprint));
          vec3 surfaceX = dFdx(-vViewPosition), surfaceY = dFdy(-vViewPosition);
          vec3 r1 = cross(surfaceY, normal), r2 = cross(normal, surfaceX);
          float determinant = dot(surfaceX, r1);
          if (abs(determinant) > .00000001) {
            normal = normalize(abs(determinant) * normal - sign(determinant) * (dFdx(relief) * r1 + dFdy(relief) * r2));
          }
        `)
        .replace('#include <opaque_fragment>', `
          // A restrained thin-tissue approximation: diffuse light carried
          // through the folded margin, without glass-like transmission.
          vec3 tissueLight = normalize((viewMatrix * vec4(-.35, .72, -.60, 0.)).xyz);
          float backScatter = pow(max(0., dot(normalize(vViewPosition), -normalize(tissueLight + normal * .15))), 3.);
          float thinMargin = .25 + .75 * pow(abs(vTissueUv.y * 2. - 1.), 3.);
          outgoingLight += diffuseColor.rgb * backScatter * thinMargin * .30 * tissueAO;
          #include <opaque_fragment>
        `)
    }
  }
  material.customProgramCacheKey = () => `living-tissue-v5-${petals}-${!!albedo}-${bakedOcclusion}`
  material.needsUpdate = true
  mesh.castShadow = true
  mesh.receiveShadow = true
}

export function createLilacDepthMaterial(uniforms, erosion) {
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide })
  depth.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLilacPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLilacPosition = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vLilacPosition;\n${erosion}`)
      .replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\nif (uErode > .025 && lilacField(vLilacPosition) < uErode) discard;')
  }
  depth.customProgramCacheKey = () => 'lilac-shadow-erosion-v1'
  return depth
}
