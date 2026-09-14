/**
 * Syringa, a single cut inflorescence studied from the Masseria's photograph.
 * Botanical layers: branched cymes, tubular corollas, four long spoon-shaped
 * lobes at varying stages of opening and folded buds. Petals are thin closed
 * swept surfaces; their rolled margin has real thickness and silhouette.
 * All vertices are baked into group space. UV = length / width of each organ.
 * aOcclusion = ambient visibility; aThickness = relative tissue thickness.
 */
// The four connected lobes were checked as an isolated flower against the
// Masseria photograph, then tessellated for the full inflorescence. Controls
// describe physical centre lines; the atlas supplies the real tissue pigment.
const COROLLA_LOBES = [
  { angle: -103, variant: 0, maxWidth: .036, asymmetry: -.085, rim: .0064,
    controls: [[0, 0, 0], [.05, -.004, -.026], [.125, -.008, -.055], [.15, -.002, -.03]] },
  { angle: -12, variant: 1, maxWidth: .0305, asymmetry: .07, rim: .0056,
    controls: [[0, 0, 0], [.055, .005, .018], [.11, .015, .005], [.149, .009, -.026]] },
  { angle: 70, variant: 2, maxWidth: .033, asymmetry: -.06, rim: .006,
    controls: [[0, 0, 0], [.054, .006, -.008], [.11, .005, -.003], [.139, -.003, .026]] },
  { angle: 172, variant: 3, maxWidth: .0315, asymmetry: .1, rim: .0053,
    controls: [[0, 0, 0], [.048, -.002, .025], [.093, -.008, .06], [.13, -.01, .05]] },
];
export function createLilacModel(THREE, { detail = 1 } = {}) {
  // The former mobile tessellation is visually sufficient for the physical
  // profiles on every screen. Explicit detail > 1.25 permits diagnostic oversampling.
  const high = detail > 1.25, V = THREE.Vector3;
  const group = new THREE.Group();
  group.name = 'Lillà di Masseria Battaglini — infiorescenza singola';
  let seed = 0x4c696c61;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const range = (a, b) => a + (b - a) * random();
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const vec = (x, y, z) => new V(x, y, z);
  const color = (hex) => new THREE.Color(hex);
  const blend = (a, b, t) => a.clone().lerp(b, clamp(t));
  const palette = {
    violet: color('#9568bf'), blue: color('#8b87c9'), lavender: color('#ad96d2'),
    rose: color('#b17caf'), pale: color('#c0b5dd'), margin: color('#cbbbe5'), inside: color('#70518b'),
    tube: color('#754195'), tubeLight: color('#9772ba'),
    bud: color('#954291'), budLight: color('#b667ac'), budSeam: color('#542153'),
    calyx: color('#435137'), calyxTip: color('#6d4860'),
    stem: color('#455737'), stemLight: color('#68704a'), bark: color('#526043'),
    pollen: color('#d8cfb1'),
  };
  const batches = {};
  for (const name of ['corollas', 'throats', 'buds', 'calyces', 'branches']) {
    batches[name] = { positions: [], colors: [], uvs: [], occlusion: [], thickness: [], variants: [], indices: [], seams: [], poles: [] };
  }
  const counts = { flowers: 0, doubleFlowers: 0, tripleFlowers: 0, petals: 0, buds: 0, leaves: 0, panicles: 1 };

  function patch(name, rows, columns, sample, closed = false, caps = 0) {
    const b = batches[name], offset = b.positions.length / 3;
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= columns; i++) {
        const u = j / rows, v = i / columns, point = sample(u, v);
        b.positions.push(point.p.x, point.p.y, point.p.z);
        b.colors.push(point.color.r, point.color.g, point.color.b);
        b.uvs.push(point.uv ? point.uv[0] : u, point.uv ? point.uv[1] : v);
        b.occlusion.push(clamp(point.ao ?? 1, 0.12, 1));
        b.thickness.push(clamp(point.thickness ?? 1, 0.015, 1));
        b.variants.push(point.variant ?? 0);
      }
    }
    // 4x4-quad blocks retain a 25-vertex working set in the GPU vertex cache.
    // This only changes index order, never the surface or tessellation.
    for (let rowBlock = 0; rowBlock < rows; rowBlock += 4) {
      for (let columnBlock = 0; columnBlock < columns; columnBlock += 4) {
        for (let j = rowBlock; j < Math.min(rows, rowBlock + 4); j++) {
          for (let i = columnBlock; i < Math.min(columns, columnBlock + 4); i++) {
            const a = offset + j * (columns + 1) + i, b0 = a + columns + 1;
            // Closed sections wind clockwise when seen from outside.
            if (closed) b.indices.push(a, a + 1, b0, a + 1, b0 + 1, b0);
            else b.indices.push(a, b0, a + 1, a + 1, b0, b0 + 1);
          }
        }
      }
    }
    if (closed) {
      for (let j = 0; j <= rows; j++) b.seams.push([offset + j * (columns + 1), offset + j * (columns + 1) + columns]);
    }
    if (caps & 1) b.poles.push(Array.from({length: columns + 1}, (_, i) => offset + i));
    if (caps & 2) b.poles.push(Array.from({length: columns + 1}, (_, i) => offset + rows * (columns + 1) + i));
  }
  function basis(normal) {
    const z = normal.clone().normalize();
    const auxiliary = Math.abs(z.y) > 0.94 ? vec(1, 0, 0) : vec(0, 1, 0);
    const x = auxiliary.cross(z).normalize();
    return { x, y: z.clone().cross(x).normalize(), z };
  }
  function place(origin, f, x, y, z) {
    return origin.clone().addScaledVector(f.x, x).addScaledVector(f.y, y).addScaledVector(f.z, z);
  }
  function twig(points, r0, r1, woody = false, exposed = 0.7) {
    const path = new THREE.CatmullRomCurve3(points);
    const rowCount = high ? Math.max(6, points.length * 4) : Math.max(4, points.length * 3);
    patch('branches', rowCount, woody ? (high ? 12 : 8) : 6, (u, v) => {
      const a = v * Math.PI * 2, frame = basis(path.getTangent(u));
      const barkRidge = Math.sin(a * 5 + u * 18) * 0.045 + Math.sin(a * 11 - u * 25) * 0.014;
      const r = mix(r0, r1, u) * (1 + barkRidge);
      const c = blend(woody ? palette.bark : palette.stem, palette.stemLight, 0.12 + 0.09 * Math.cos(a * 3 + u * 9));
      return { p: place(path.getPoint(u), frame, Math.cos(a) * r, Math.sin(a) * r, 0), color: c, ao: exposed, thickness: 1 };
    }, true);
  }
  function calyx(origin, frame, scale) {
    patch('calyces', 5, high ? 12 : 8, (u, v) => {
      const a = v * Math.PI * 2, lobe = Math.max(0, Math.cos(a * 4)) ** 3;
      const r = scale * (0.0095 + 0.004 * Math.sin(Math.PI * u) - 0.002 * u);
      return {
        p: place(origin, frame, Math.cos(a) * r, Math.sin(a) * r, scale * (0.025 * u + 0.011 * lobe * u ** 3)),
        color: blend(palette.calyx, palette.calyxTip, u * 0.74), ao: 0.5, thickness: 0.75,
      };
    }, true);
  }
  function flower(flowerData) {
    const { origin, normal, scale, phase, visibility, age, opening } = flowerData;
    // Keep the established seeded sequence: each former flower consumed sixty
    // samples. Positions, stems, buds, and their terminal cluster stay identical.
    const variation = Array.from({ length: 60 }, random);
    const frame = basis(normal), tubeLength = scale * mix(.1, .145, variation[0]);
    const mouth = scale * mix(.0083, .0091, variation[1]);
    const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
    let tint = age < .36 ? blend(palette.rose, palette.violet, age / .36)
      : age < .74 ? blend(palette.violet, palette.blue, (age - .36) / .38)
        : blend(palette.blue, palette.pale, (age - .74) / .26);
    tint = blend(tint, palette.lavender, mix(.01, .08, variation[2]));
    const tintLight = blend(tint, palette.lavender, mix(.08, .2, variation[3]));
    const tubeBend = scale * mix(-.01, .01, variation[4]);
    const neckRadius = angle => mouth * (1 + .09 * Math.cos(4 * angle + .1) + .025 * Math.sin(3 * angle));
    const neckHeight = angle => scale * .0011 * Math.sin(2 * angle + .4);
    const youth = clamp((1 - opening) / .52);
    // Age changes the degree of opening and the strength of each known curve,
    // rather than inventing random twists in every patch of tissue.
    const fold = mix(.91, 1.18, youth) + .05 * (variation[5] - .5);
    const crownTilt = youth * .21;
    calyx(origin, frame, scale);
    // One ribbed tube shares its neck boundary with all four petal sectors.
    // There is no added annular collar between the tube and the lamina.
    patch('corollas', high ? 10 : 8, high ? 16 : 12, (s, v) => {
      const a = v * Math.PI * 2, r = mix(scale * .0064, neckRadius(a - phase), s) + scale * .0009 * Math.sin(s * Math.PI);
      return {
        p: place(origin, frame, Math.cos(a) * r + tubeBend * Math.sin(s * Math.PI), Math.sin(a) * r, tubeLength * s + neckHeight(a - phase) * s ** 5),
        color: blend(palette.tube, tintLight, .2 + .68 * s), uv: [s * .11, (Math.cos(a) + 1) * .5],
        ao: visibility * mix(.76, .91, s), thickness: .65,
      };
    }, true);
    for (let i = 0; i < COROLLA_LOBES.length; i++) {
      const lobe = COROLLA_LOBES[i], localAngle = lobe.angle * Math.PI / 180, angle = phase + localAngle;
      const previous = COROLLA_LOBES[(i + 3) % 4].angle - (i === 0 ? 360 : 0);
      const next = COROLLA_LOBES[(i + 1) % 4].angle + (i === 3 ? 360 : 0);
      const minusAngle = (lobe.angle - previous) * .5 * Math.PI / 180;
      const plusAngle = (next - lobe.angle) * .5 * Math.PI / 180;
      const lengthScale = scale * mix(.965, 1.025, age);
      const tilt = crownTilt * [1, .75, .9, .7][i];
      const controls = lobe.controls.map(([x, y, z]) => {
        x *= lengthScale; y *= lengthScale; z *= lengthScale * fold;
        return vec(x * Math.cos(tilt) - z * Math.sin(tilt), y, x * Math.sin(tilt) + z * Math.cos(tilt));
      });
      const path = new THREE.CubicBezierCurve3(...controls);
      patch('corollas', high ? 20 : 14, high ? 16 : 12, (along, around) => {
        const s = .5 - .5 * Math.cos(Math.PI * along);
        const section = around * Math.PI * 2, v = Math.cos(section), face = Math.sin(section);
        const delta = v * (v < 0 ? minusAngle : plusAngle);
        const boundaryAngle = localAngle + delta, neckR = neckRadius(boundaryAngle);
        const baseRadial = neckR * Math.cos(delta), baseSide = neckR * Math.sin(delta);
        const center = path.getPoint(s), tangent = path.getTangent(s);
        const across = vec(-tangent.y, tangent.x, 0).normalize();
        const surfaceNormal = tangent.clone().cross(across).normalize();
        const attach = smooth(s / .07);
        // The short attachment opens promptly into a full lamina. A long
        // second taper here makes the four lobes look like propeller blades.
        const shoulder = .47 + .53 * smooth(s / .235);
        const capStart = .69 + .025 * v, capS = clamp((s - capStart) / (1 - capStart));
        const terminal = Math.sqrt(Math.max(0, 1 - capS * capS));
        const width = lobe.maxWidth * lengthScale * shoulder * terminal * (1 + lobe.asymmetry * v * Math.sin(Math.PI * s));
        const side = mix(baseSide, v * width, attach);
        const edge = Math.abs(v), envelope = Math.sin(Math.PI * s) ** .64;
        // The transported cross-section follows the longitudinal bowl. Only
        // the outer lip rolls upward; the centre remains broad and readable.
        const rim = lobe.rim * scale * mix(1, 1.14, youth) * edge ** 8 * envelope * (1 + .1 * v);
        const channel = -scale * .0012 * (1 - v * v) ** 3 * Math.sin(Math.PI * s);
        const tissue = scale * (.00036 + .00035 * Math.sin(Math.PI * s)) * terminal * face;
        const rolledSide = side * (1 - .065 * edge ** 10 * envelope);
        const local = center.clone().add(vec(mix(baseRadial, mouth, attach), 0, neckHeight(boundaryAngle) * (1 - attach)));
        local.addScaledVector(across, rolledSide).addScaledVector(surfaceNormal, rim + channel + tissue);
        const x = Math.cos(angle) * local.x - Math.sin(angle) * local.y;
        const y = Math.sin(angle) * local.x + Math.cos(angle) * local.y;
        let c = blend(palette.tube, tintLight, .25 + .75 * smooth(s / .29));
        c = blend(c, palette.margin, edge ** 6 * .45 + .035 * s);
        return {
          p: place(origin, frame, x, y, tubeLength + local.z), color: c, uv: [s, (v + 1) * .5], variant: lobe.variant,
          ao: visibility * mix(.82, 1, smooth(s / .22)), thickness: .16 + .33 * (1 - edge),
        };
      }, true, 2);
      counts.petals++;
    }
    // The small throat closes in depth, rather than exposing the background.
    // Its wavy edge is the same boundary as the tube and connected petal bases.
    patch('throats', high ? 7 : 5, high ? 16 : 12, (s, v) => {
      const a = v * Math.PI * 2, r = neckRadius(a - phase) * mix(0, .985, s ** .62);
      return {
        p: place(origin, frame, Math.cos(a) * r, Math.sin(a) * r, tubeLength - scale * .036 * (1 - s) + neckHeight(a - phase) * s),
        color: blend(palette.tube, tint, .12 + .67 * s), ao: visibility * mix(.65, .91, s), thickness: .6,
      };
    }, false, 1);
    const antherSide = scale * mix(-.0031, -.0018, variation[59]);
    patch('throats', high ? 6 : 4, high ? 8 : 6, (s, v) => {
      const a = v * Math.PI * 2, r = Math.sin(Math.PI * s);
      return {
        p: place(origin, frame, antherSide + scale * .0025 * r * Math.cos(a), scale * (.0007 + .0018 * r * Math.sin(a)), tubeLength + scale * (-.012 + s * .007)),
        color: palette.pollen, ao: visibility * .83, thickness: .6,
      };
    }, true, 3);
    counts.flowers++;
  }
  function bud(origin, direction, scale, exposed = 0.8) {
    const frame = basis(direction), length = scale * range(0.09, 0.123), radius = scale * range(0.022, 0.03);
    const phase = range(0, Math.PI * 2), bend = scale * range(-0.008, 0.008);
    calyx(origin, frame, scale);
    patch('buds', high ? 12 : 8, high ? 16 : 12, (u, v) => {
      const a = v * Math.PI * 2 + phase, lobeAngle = a + 0.15 * Math.sin(Math.PI * u);
      const seam = Math.exp(-((Math.sin(lobeAngle * 2) / 0.2) ** 2));
      const shape = Math.sin(Math.PI * u) ** 0.57, r = radius * shape * (1 - 0.23 * seam);
      let c = blend(palette.bud, palette.budLight, 0.12 + 0.47 * u + 0.08 * Math.cos(a));
      c = blend(c, palette.budSeam, seam * 0.64);
      return {
        p: place(origin, frame, Math.cos(a) * r + bend * Math.sin(Math.PI * u), Math.sin(a) * r, length * u),
        color: c, ao: exposed * (0.64 + 0.3 * u), thickness: 0.78,
      };
    }, true, 3);
    counts.buds++;
  }

  // One fine stem enters the inflorescence; every branchlet stays inside it.
  const base = vec(0.18, -1.4, 0.03), neck = vec(-0.09, -0.26, -0.015);
  twig([base, vec(0.075, -0.95, 0.015), vec(-0.07, -0.48, -0.005), neck], 0.0135, 0.01, true, 0.95);
  function axisPoint(t) {
    return vec(-0.09 - 0.13 * t + 0.045 * Math.sin(t * 5), -0.26 + 1.52 * t, -0.015 + 0.045 * Math.sin(t * 4.7));
  }
  twig([neck, axisPoint(0.32), axisPoint(0.7), axisPoint(1.015)], 0.012, 0.0028, false, 0.45);
  const golden = Math.PI * (3 - Math.sqrt(5)), descriptors = [];
  function describe(origin, normal, t, isBud, scale) {
    const roll = random();
    // Neighbouring flowers share an age/colour tendency, avoiding coloured
    // confetti while making fresh magenta and older pale lavender observable.
    const age = clamp(0.59 + 0.19 * Math.sin(origin.x * 6.7 + origin.y * 4.9) + 0.16 * Math.cos(origin.y * 6.8 - origin.z * 5) + range(-0.065, 0.065), 0.17, 0.98);
    const opening = age < 0.42 ? mix(0.5, 0.84, age / 0.42) : mix(0.86, 1.02, (age - 0.42) / 0.58);
    descriptors.push({ origin, normal, scale, age, opening, phase: range(0, Math.PI * 2), whorls: 1, isBud, axis: axisPoint(t), t, visibility: 0.96 });
  }
  // The reference is a mass of overlapping corollas throughout the front of
  // the panicle. Projected-area packing fills that volume rather than placing
  // all flowers on an empty cylindrical cage. Depth varies by several tubes.
  const frontCount = 108;
  for (let i = 0; i < frontCount; i++) {
    const a = i * golden + range(-0.12, 0.12), radius = Math.sqrt((i + 0.45) / frontCount);
    const nx = Math.cos(a) * radius, ny = Math.sin(a) * radius;
    const t = clamp(0.5 + ny * 0.48 + range(-0.018, 0.018), 0.025, 0.99);
    const axis = axisPoint(t), lobe = 1 + 0.14 * Math.sin(a * 3 + ny * 5) + 0.05 * Math.cos(a * 5 - ny * 3);
    const shoulder = -0.055 * Math.exp(-(((ny - 0.25) / 0.3) ** 2)) * Math.max(0, -nx);
    const origin = axis.clone().add(vec(nx * 0.44 * lobe + shoulder, range(-0.027, 0.027) - 0.035 * radius ** 3 * Math.cos(a * 3), 0.095 + 0.22 * Math.sqrt(1 - radius * radius) + range(-0.055, 0.04)));
    const normal = vec(nx * 0.69 + range(-0.26, 0.26), ny * 0.36 + range(-0.2, 0.3), 0.91 + range(-0.12, 0.12)).normalize();
    if (radius > 0.8 && Math.abs(nx) > 0.48 && i % 3 === 0) normal.set(nx * 1.35, ny * 0.36, 0.36).normalize();
    if (i < 82) normal.lerp(vec(0, 0, 1), 0.35).normalize();
    describe(origin, normal, t, (t > 0.87 && random() < 0.31) || random() < 0.028, range(0.87, 1.11));
  }
  // Rear and lateral florets complete the volume and remain visible during
  // the small turn of the flower, with varying upward and diagonal attitudes.
  for (let i = 0; i < 48; i++) {
    const t = clamp((i + 0.5) / 48 + range(-0.05, 0.05), 0.035, 0.985);
    const a = i * golden + range(-0.23, 0.23), axis = axisPoint(t);
    const profile = Math.sqrt(Math.max(0.055, 1 - ((t - 0.44) / 0.59) ** 2));
    const radial = vec(Math.cos(a), range(-0.1, 0.2), -Math.abs(Math.sin(a))).normalize();
    const origin = axis.clone().addScaledVector(radial, 0.395 * profile * range(0.87, 1.1));
    const normal = radial.clone().add(vec(range(-0.17, 0.17), 0.13 + t * 0.2, range(-0.17, 0.17))).normalize();
    describe(origin, normal, t, t > 0.91 || random() < 0.11, range(0.9, 1.12));
  }
  // Three small front-facing bud groups emerge amongst open flowers. Their
  // neighbours are partially open rather than every floret being identical.
  for (const centre of [vec(0.04, 1.03, 0.32), vec(-0.43, 0.47, 0.33), vec(-0.06, 0.05, 0.33)]) {
    const near = descriptors.slice(0, frontCount).map(d => ({d, distance: Math.hypot(d.origin.x - centre.x, d.origin.y - centre.y)})).sort((a, b) => a.distance - b.distance);
    for (let i = 0; i < 5; i++) {
      const d = near[i].d;
      d.age = range(0.13, 0.25); d.opening = range(0.48, 0.64);
      if (i < 3) {
        d.isBud = true; d.scale *= 0.94;
        d.origin.z = Math.max(d.origin.z, 0.36) + range(0, 0.035);
        d.normal = vec(range(-0.23, 0.23), range(0.12, 0.48), 0.9).normalize();
      }
    }
  }
  // Relax close neighbours without destroying their branched cyme structure.
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < descriptors.length; i++) {
      const a = descriptors[i];
      for (let j = 0; j < i; j++) {
        const b = descriptors[j], separation = a.origin.clone().sub(b.origin), distance = separation.length();
        const minDistance = (a.isBud || b.isBud) ? 0.06 : 0.094;
        if (distance > 0.0001 && distance < minDistance) {
          separation.multiplyScalar((minDistance - distance) / distance * 0.26);
          a.origin.add(separation); b.origin.sub(separation);
        }
      }
    }
  }
  for (const descriptor of descriptors.slice(0, frontCount)) {
    descriptor.origin.x = -0.16 + (descriptor.origin.x + 0.16) * 0.93;
    descriptor.origin.y = 0.5 + (descriptor.origin.y - 0.5) * 0.93;
  }
  // Give adjacent frontal flower faces a little depth separation. Real lobes
  // overlap and yield; two mathematical surfaces should not cut each other.
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < frontCount; i++) {
      const a = descriptors[i];
      if (a.isBud) continue;
      for (let j = 0; j < i; j++) {
        const b = descriptors[j];
        if (b.isBud) continue;
        const xy = Math.hypot(a.origin.x - b.origin.x, a.origin.y - b.origin.y);
        const za = a.origin.z + a.normal.z * 0.13, zb = b.origin.z + b.normal.z * 0.13;
        if (xy < 0.17 && Math.abs(za - zb) < 0.052) {
          const correction = (0.052 - Math.abs(za - zb)) * (1 - xy / 0.17) * 0.2;
          const sign = za > zb ? 1 : -1;
          a.origin.z += correction * sign; b.origin.z -= correction * sign;
        }
      }
    }
  }
  for (const descriptor of descriptors) {
    let neighbours = 0;
    for (const other of descriptors) {
      if (other === descriptor) continue;
      const d = descriptor.origin.distanceTo(other.origin);
      if (d < 0.235) neighbours += 1 - d / 0.235;
    }
    descriptor.visibility = clamp(1 - neighbours * 0.035, 0.81, 0.99);
    // Most of the fine ramification is hidden in this dense flower head;
    // preserve only the short final pedicel, never long visible radial ribs.
    const rootPoint = descriptor.origin.clone().addScaledVector(descriptor.normal, -0.058);
    const forkPoint = rootPoint.clone().lerp(descriptor.origin, 0.56).add(vec(0, -0.006, 0));
    twig([rootPoint, forkPoint, descriptor.origin], 0.003, 0.0021, false, 0.65);
    if (descriptor.isBud) bud(descriptor.origin, descriptor.normal, descriptor.scale * 0.93, descriptor.visibility);
    else flower(descriptor);
  }
  // A few uneven terminal buds finish the panicle without a pointed tuft.
  for (let i = 0; i < 7; i++) {
    const a = i * golden, position = axisPoint(range(0.97, 1.025));
    position.add(vec(Math.cos(a) * range(0.018, 0.058), range(-0.02, 0.015), Math.sin(a) * range(0.018, 0.058)));
    const normal = vec(Math.cos(a) * 0.33, 0.9, Math.sin(a) * 0.33).normalize();
    twig([axisPoint(0.96), position], 0.0028, 0.0018, false, 0.67);
    bud(position, normal, range(0.63, 0.81), 0.9);
  }
  const surfaces = [], roughness = { corollas: 0.71, throats: 0.82, buds: 0.61, calyces: 0.79, branches: 0.89 };
  let vertices = 0, triangles = 0, geometryBytes = 0;
  for (const [name, data] of Object.entries(batches)) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
    geometry.setAttribute('aOcclusion', new THREE.Float32BufferAttribute(data.occlusion, 1));
    geometry.setAttribute('aThickness', new THREE.Float32BufferAttribute(data.thickness, 1));
    geometry.setAttribute('aPetalVariant', new THREE.Float32BufferAttribute(data.variants, 1));
    geometry.setIndex(data.indices); geometry.computeVertexNormals();
    // The periodic first/last vertex of a closed patch occupies one physical
    // point. Average its normals so the thin rounded lip has no artificial cut.
    const normals = geometry.attributes.normal.array;
    for (const [first, last] of data.seams) {
      const a = first * 3, b = last * 3;
      const nx = normals[a] + normals[b], ny = normals[a + 1] + normals[b + 1], nz = normals[a + 2] + normals[b + 2];
      const length = Math.hypot(nx, ny, nz) || 1;
      normals[a] = normals[b] = nx / length; normals[a + 1] = normals[b + 1] = ny / length; normals[a + 2] = normals[b + 2] = nz / length;
    }
    for (const pole of data.poles) {
      let nx = 0, ny = 0, nz = 0;
      for (const i of pole) { nx += normals[i * 3]; ny += normals[i * 3 + 1]; nz += normals[i * 3 + 2]; }
      const length = Math.hypot(nx, ny, nz) || 1;
      for (const i of pole) { normals[i * 3] = nx / length; normals[i * 3 + 1] = ny / length; normals[i * 3 + 2] = nz / length; }
    }
    geometry.computeBoundingSphere();
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: roughness[name], metalness: 0, side: THREE.DoubleSide });
    material.name = `Lilac ${name}`;
    material.userData = { botanicalSurface: name, sss: name === 'corollas', aoAttribute: 'aOcclusion', thicknessAttribute: 'aThickness' };
    const mesh = new THREE.Mesh(geometry, material); mesh.name = `Lilac ${name}`;
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.botanicalSurface = name;
    group.add(mesh); surfaces.push(mesh);
    vertices += geometry.attributes.position.count; triangles += geometry.index.count / 3;
    for (const attribute of Object.values(geometry.attributes)) geometryBytes += attribute.array.byteLength;
    geometryBytes += geometry.index.array.byteLength;
  }
  const bounds = new THREE.Box3().setFromObject(group);
  Object.assign(counts, { vertices, triangles, drawCalls: surfaces.length, geometryBytes });
  group.userData.botanicalCounts = counts;
  return { group, surfaces, bounds, counts };
}
