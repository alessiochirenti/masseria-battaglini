// build.mjs — genera il sito statico in dist/ a partire da:
//   content/*.json   i contenuti che il cliente modifica dal pannello (/admin)
//   src/*.html       i template delle pagine (struttura, animazioni: nostri)
//   src/_partials/   pezzi condivisi (menu, modulo, footer)
//   public/          file statici copiati identici (css, js, font, uploads)
//
// Nessuna dipendenza: Node 18+ basta. Uso: node build.mjs
//
// Sintassi dei template (volutamente minima):
//   {{campo.sotto}}              valore con escape HTML; *corsivo* diventa <em>
//   {{{campo}}}                  valore grezzo, senza escape
//   {{#each lista}} … {{/each}}  ripete; dentro: {{.}} elemento, {{@n}} numero da 1
//   {{#if campo}} … {{else}} … {{/if}}
//   {{#paragrafi campo}} … {{/paragrafi}}   ripete per ogni paragrafo (righe vuote)
//   {{> nome}}                   include src/_partials/nome.html
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { languages, loadSource, dictionaries, mapContent } from './scripts/i18n.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')

// ─── testo: escape + markup minimo ───────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// i percorsi dei file caricati dal pannello sono assoluti (/uploads/x.webp): li rendiamo
// relativi, così il sito funziona anche sotto una sottocartella (GitHub Pages)
const rel = (s) => (s.startsWith('/uploads/') ? s.slice(1) : s)
function inline(v) {
  if (v == null) return ''
  const s = String(v)
  if (s.startsWith('/uploads/')) return esc(rel(s))
  return esc(s).replace(/\*([^*\n]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>')
}
const paragraphs = (s) => String(s || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

// ─── template engine ─────────────────────────────────────────────────────────
const TOKEN = /\{\{\{\s*([^}]+?)\s*\}\}\}|\{\{\s*(#each|#if|#paragrafi|\/each|\/if|\/paragrafi|else|>)?\s*([^}]*?)\s*\}\}/g

// Parser: costruisce un albero; i figli dopo {{else}} finiscono nel ramo alt.
function parseTpl(tpl) {
  const root = { type: 'root', children: [], alt: [] }
  const stack = [root]
  const target = (n) => (n.inAlt ? n.alt : n.children)
  let last = 0
  for (const m of tpl.matchAll(TOKEN)) {
    const top = stack[stack.length - 1]
    if (m.index > last) target(top).push({ type: 'text', value: tpl.slice(last, m.index) })
    last = m.index + m[0].length
    if (m[1] != null) {
      if (!/^[\w@.]+$/.test(m[1].trim())) throw Error('Espressione del template non valida: '+m[0])
      target(top).push({ type: 'raw', path: m[1].trim() }); continue
    }
    const kind = m[2], arg = m[3].trim()
    if ((!kind || kind.startsWith('#')) && !/^[\w@.]+$/.test(arg)) throw Error('Espressione del template non valida: '+m[0])
    if (!kind) target(top).push({ type: 'var', path: arg })
    else if (kind === '>') target(top).push({ type: 'partial', name: arg })
    else if (kind.startsWith('#')) { const node = { type: kind.slice(1), path: arg, children: [], alt: [] }; target(top).push(node); stack.push(node) }
    else if (kind === 'else') top.inAlt = true
    else if (kind.startsWith('/')) {
      if (top.type !== kind.slice(1)) throw Error('Blocco del template non bilanciato: '+m[0])
      stack.pop()
    }
  }
  if (last < tpl.length) target(root).push({ type: 'text', value: tpl.slice(last) })
  if (stack.length !== 1) throw Error('Blocco del template non chiuso')
  return root
}

// Lookup: prima il contesto più interno (elemento del ciclo), poi quelli esterni, infine la radice.
function lookup(path, ctxs) {
  const top = ctxs[ctxs.length - 1]
  if (path === '.') return top.value
  if (path === '@n') return top.n
  if (path === '@index') return top.n - 1
  const parts = path.split('.')
  for (let i = ctxs.length - 1; i >= 0; i--) {
    let cur = ctxs[i].value, ok = true
    for (const p of parts) {
      if (cur != null && typeof cur === 'object' && p in cur) cur = cur[p]
      else { ok = false; break }
    }
    if (ok) return cur
  }
  return undefined
}
const truthy = (v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '' && v !== false)

function render(nodes, ctxs, partials) {
  let out = ''
  for (const n of nodes) {
    if (n.type === 'text') out += n.value
    else if (n.type === 'var') out += inline(lookup(n.path, ctxs))
    else if (n.type === 'raw') { const v = lookup(n.path, ctxs); out += v == null ? '' : String(v) }
    else if (n.type === 'partial') {
      if (!partials[n.name]) throw new Error(`Partial mancante: ${n.name}`)
      out += render(partials[n.name].children, ctxs, partials)
    } else if (n.type === 'if') out += render(truthy(lookup(n.path, ctxs)) ? n.children : n.alt, ctxs, partials)
    else if (n.type === 'each') {
      const list = lookup(n.path, ctxs)
      if (Array.isArray(list) && list.length) list.forEach((item, i) => { out += render(n.children, [...ctxs, { value: item, n: i + 1 }], partials) })
      else out += render(n.alt, ctxs, partials)
    } else if (n.type === 'paragrafi') {
      paragraphs(lookup(n.path, ctxs)).forEach((p, i) => { out += render(n.children, [...ctxs, { value: p, n: i + 1 }], partials) })
    }
  }
  return out
}

// All languages are validated before touching the previous build.
const source = loadSource()
const catalogs = dictionaries(source)
const guestbook = JSON.parse(readFileSync(join(ROOT, 'public/uploads/guestbook/manifest.json'), 'utf8'))
function prepare(data, locale) {
  data.guestbook.pages = data.guestbook.pages.map((p,i) => ({...p,image:rel(guestbook.pages[i].url),lang:locale}))
  data.anno = new Date().getFullYear()
  data.home.terra.numeri.forEach(n => {
    if (/^\d+(,\d+)?$/.test(n.valore)) n.valore = Number(n.valore.replace(',','.')).toLocaleString(locale)
  })
  data.site.robots = data.site.indicizza ? '' : '<meta name="robots" content="noindex,nofollow">'
  function prepareDimora(d,i) {
    d.flip=i%2===1?'flip':''
    d.anteprime=(d.galleria||[]).slice(0,3).map((foto,i)=>({foto,i}))
    d.galleria_json=JSON.stringify((d.galleria||[]).map(rel));d.n_foto=(d.galleria||[]).length
    ;(d.piani||[]).forEach((p,j)=>prepareDimora(p,j+1))
  }
  ;(data.dimore.elenco||[]).forEach(prepareDimora)
  data.dimore.scelte_richiesta=data.dimore.elenco.flatMap(d=>d.configurazioni?.length?d.configurazioni.map(c=>d.nome+': '+c.nome):[d.nome])
  for(const section of data.esperienze.sezioni)for(const [i,v]of(section.voci||[]).entries())v.flip=i%2===1?'flip':''
  if(locale!=='it') {
    data.recensioni.rating=Number(source.recensioni.rating.replace(',','.')).toLocaleString(locale)
    data.recensioni.reviews.forEach(r=>{r.translated=true})
    data.ui.googleTranslation=data.ui.translatedExcerpt
  }
  return data
}
const partials={}
for(const f of readdirSync(join(SRC,'_partials')))partials[f.replace('.html','')]=parseTpl(readFileSync(join(SRC,'_partials',f),'utf8'))
// DIST is a fixed child of this repository, never a user-supplied deletion path.
rmSync(DIST,{recursive:true,force:true});mkdirSync(DIST,{recursive:true})
cpSync(join(ROOT,'public'),DIST,{recursive:true});cpSync(join(ROOT,'admin'),join(DIST,'admin'),{recursive:true})
writeFileSync(join(DIST,'.nojekyll'),'')
let pages=0
const base=source.site.url.replace(/\/?$/,'/')
for(const language of languages){
 const locale=language.code, prefix=locale==='it'?'':'../', folder=locale==='it'?'':locale+'/'
 const data=prepare(mapContent(source,text=>locale==='it'?text:catalogs[locale][text]),locale)
 const runtime=Object.fromEntries(Object.values(source.ui).map(text=>[text,locale==='it'?text:catalogs[locale][text]]))
 const ui_json=JSON.stringify(runtime).replace(/</g,'\\u003c')
 mkdirSync(join(DIST,folder),{recursive:true})
 for(const f of readdirSync(SRC).filter(f=>f.endsWith('.html'))){
  const page=f.slice(0,-5)
  const ctx={...data,locale,language_name:language.name,og_locale:{it:'it_IT',en:'en_GB',fr:'fr_FR',de:'de_DE',es:'es_ES'}[locale],ui_json,page,is_home:page==='index',
    canonical:base+folder+(page==='index'?'':f),
    alternate_languages:[...languages.map(l=>({code:l.code,url:base+(l.code==='it'?'':l.code+'/')+(page==='index'?'':f)})),{code:'x-default',url:base+(page==='index'?'':f)}],
    language_links:languages.map(l=>({...l,current:l.code===locale,href:prefix+(l.code==='it'?'':l.code+'/')+f}))}
  let html=render(parseTpl(readFileSync(join(SRC,f),'utf8')).children,[{value:ctx,n:0}],partials)
  html=html.replace(/(["'(])((?:uploads|css|js|fonts)\/)/g,(_,q,path)=>q+prefix+path)
  if(/\{\{[^}]*\}\}/.test(html))throw Error('Unresolved template: '+folder+f)
  writeFileSync(join(DIST,folder,f),html,'utf8');pages++
 }
}
console.log('✔ '+pages+' pagine generate in cinque lingue, asset condivisi.')
