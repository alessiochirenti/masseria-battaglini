// CPU-only construction. Geometry + particle sampling never block page input.
import { createLilacModel } from './lilac-model.js'
import { applyBakedOcclusion } from './lilac-occlusion.js'

function surfaceSamples(surfaces, count) {
  let seed = 984371
  const rand = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296 }
  let total = 0
  const lists = surfaces.map((mesh) => {
    const p = mesh.geometry.attributes.position.array, index = mesh.geometry.index?.array
    const n = (index?.length ?? p.length / 3) / 3, areas = new Float64Array(n)
    for (let t = 0; t < n; t++) {
      const a = (index ? index[t * 3] : t * 3) * 3
      const b = (index ? index[t * 3 + 1] : t * 3 + 1) * 3
      const c = (index ? index[t * 3 + 2] : t * 3 + 2) * 3
      const ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2]
      const vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2]
      total += Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)*.5
      areas[t] = total
    }
    return {p,index,areas,end:total}
  })
  const positions = new Float32Array(count * 3), seeds = new Float32Array(count * 4)
  for (let i=0;i<count;i++) {
    const target = rand()*total
    const part = lists.find((l)=>l.end>=target) ?? lists[lists.length-1]
    let lo=0,hi=part.areas.length-1
    while(lo<hi){const m=(lo+hi)>>>1;if(part.areas[m]<target)lo=m+1;else hi=m}
    const {p,index}=part
    const a=(index?index[lo*3]:lo*3)*3,b=(index?index[lo*3+1]:lo*3+1)*3,c=(index?index[lo*3+2]:lo*3+2)*3
    const u=Math.sqrt(rand()),v=rand(),wa=1-u,wb=u*(1-v),wc=u*v
    for(let k=0;k<3;k++)positions[i*3+k]=p[a+k]*wa+p[b+k]*wb+p[c+k]*wc
    seeds.set([rand(),rand(),rand(),rand()],i*4)
  }
  return {positions,seeds}
}

self.onmessage = async ({data}) => {
  try {
    // Import maps do not apply inside workers. The page resolves its pinned URL.
    const THREE = await import(data.threeUrl)
    const model = createLilacModel(THREE,{detail:data.detail})
    model.counts.bakedOcclusion = await applyBakedOcclusion(model)
    const samples = surfaceSamples(model.surfaces,data.particleCount)
    const transfer = [samples.positions.buffer,samples.seeds.buffer]
    const parts = model.surfaces.map(mesh=>{
      const attributes={}
      for(const [name,a] of Object.entries(mesh.geometry.attributes)){
        attributes[name]={array:a.array,itemSize:a.itemSize,normalized:a.normalized}
        transfer.push(a.array.buffer)
      }
      const index=mesh.geometry.index?.array
      if(index)transfer.push(index.buffer)
      return {name:mesh.name,attributes,index,material:mesh.material.toJSON()}
    })
    self.postMessage({parts,samples,counts:model.counts},transfer)
  }catch(error){self.postMessage({error:error.message})}
}
