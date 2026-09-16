import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const languages = [{code:'it',name:'Italiano'}, {code:'en',name:'English'}, {code:'fr',name:'Français'}, {code:'de',name:'Deutsch'}, {code:'es',name:'Español'}]
export function loadSource() {
  return Object.fromEntries(readdirSync(join(ROOT,'content')).filter(f=>f.endsWith('.json')).map(f=>[f.slice(0,-5),JSON.parse(readFileSync(join(ROOT,'content',f),'utf8'))]))
}
const technical = new Set(['id','ancora','foto','video','poster','logo','url','source','verified','posizione_foto','language','file','image','fonte','autore','author','rating'])
export function translatable(value, path) {
  if(typeof value!=='string'||!value.trim())return false
  if(path.startsWith('ui.'))return true
  if(path.startsWith('site.contatti.')||path.startsWith('recensioni.provenance.'))return false
  if(technical.has(path.split('.').at(-1)))return false
  return !/^(?:https?:|\/uploads\/|[\w-]+\.html(?:#.*)?$|[\d,.]+$)/.test(value)
}
export function mapContent(value, fn, path='') {
  if(Array.isArray(value))return value.map((v,i)=>mapContent(v,fn,path+'.'+i))
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,mapContent(v,fn,path?path+'.'+k:k)]))
  return translatable(value,path)?fn(value,path):value
}
export function catalog(data) {
  const result={};mapContent(data,(text,path)=>{(result[text]??=[]).push(path);return text});return result
}
export function dictionaries(data) {
  const sources=catalog(data), result={it:{}}
  for(const {code} of languages.slice(1)){
    const file=join(ROOT,'locales',code+'.json')
    const dict=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{}
    const missing=Object.keys(sources).filter(s=>!Object.hasOwn(dict,s)||typeof dict[s]!=='string'||!dict[s].trim())
    if(missing.length)throw Error(`Traduzioni ${code} mancanti o obsolete (${missing.length}):\n`+missing.slice(0,12).map(s=>sources[s][0]+': '+s.slice(0,80)).join('\n'))
    for(const s of Object.keys(sources)){
      const tokens=t=>[...t.matchAll(/%\w+%/g)].map(m=>m[0]).sort().join(',')
      if(tokens(s)!==tokens(dict[s]))throw Error(`Segnaposti ${code} incoerenti: ${s}`)
    }
    result[code]=dict
  }
  return result
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const data=loadSource()
  if(process.argv.includes('--catalog')){
    mkdirSync(join(ROOT,'locales'),{recursive:true});writeFileSync(join(ROOT,'locales','source.json'),JSON.stringify(catalog(data),null,2)+'\n');console.log(Object.keys(catalog(data)).length+' stringhe sorgente')
  } else {dictionaries(data);console.log('Traduzioni complete e segnaposti coerenti in tutte le lingue.')}
}
