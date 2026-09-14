// Cycles-baked local visibility, guarded against changes to the model.
// A failed download or a changed vertex layout retains procedural visibility.
export async function applyBakedOcclusion(model) {
  if (!globalThis.crypto?.subtle) return false
  try {
    const response = await fetch(new URL('../uploads/lilla-occlusione.bin', import.meta.url), {
      cache: 'no-cache', signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return false
    const buffer = await response.arrayBuffer(), bytes = new Uint8Array(buffer)
    const decoder = new TextDecoder()
    if (bytes.length < 12 || decoder.decode(bytes.subarray(0, 8)) !== 'LILACAO1') return false
    const size = new DataView(buffer).getUint32(8, true), start = 12 + size
    if (start > bytes.length) return false
    const header = JSON.parse(decoder.decode(bytes.subarray(12, start)))
    if (header.parts.length !== model.surfaces.length) return false
    const validated = await Promise.all(model.surfaces.map(async mesh => {
      const part = header.parts.find(part => part.name === mesh.name)
      const positions = mesh.geometry.attributes.position
      if (!part || part.count !== positions.count || part.offset < 0 || start + part.offset + part.count > bytes.length) return null
      const digest = await crypto.subtle.digest('SHA-256', positions.array)
      const signature = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('')
      return signature === part.signature ? {mesh, part} : null
    }))
    if (validated.some(part => !part)) return false
    for (const {mesh, part} of validated) {
      const visibility = mesh.geometry.attributes.aOcclusion.array
      for (let i = 0; i < visibility.length; i++) visibility[i] = .16 + .84 * bytes[start + part.offset + i] / 255
    }
    return true
  } catch {
    return false
  }
}
