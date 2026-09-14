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

const ROOT = dirname(fileURLToPath(import.meta.url))
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')

// ─── contenuti ───────────────────────────────────────────────────────────────
function loadContent() {
  const data = {}
  for (const f of readdirSync(join(ROOT, 'content'))) {
    if (f.endsWith('.json')) data[f.replace('.json', '')] = JSON.parse(readFileSync(join(ROOT, 'content', f), 'utf8'))
  }
  return data
}

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
    if (m[1] != null) { target(top).push({ type: 'raw', path: m[1].trim() }); continue }
    const kind = m[2], arg = m[3].trim()
    if (!kind) target(top).push({ type: 'var', path: arg })
    else if (kind === '>') target(top).push({ type: 'partial', name: arg })
    else if (kind.startsWith('#')) { const node = { type: kind.slice(1), path: arg, children: [], alt: [] }; target(top).push(node); stack.push(node) }
    else if (kind === 'else') top.inAlt = true
    else if (kind.startsWith('/')) stack.pop()
  }
  if (last < tpl.length) target(root).push({ type: 'text', value: tpl.slice(last) })
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

// ─── dati derivati, comodi per i template ────────────────────────────────────
const data = loadContent()
const guestbook = JSON.parse(readFileSync(join(ROOT, 'public/uploads/guestbook/manifest.json'), 'utf8'))
data.guestbook = { pages: guestbook.pages.map(p => ({ image: rel(p.url), title: p.title, transcript: p.transcription, lang: p.language })) }
data.anno = new Date().getFullYear()
data.site.robots = data.site.indicizza ? '' : '<meta name="robots" content="noindex,nofollow">'
for (const [i, d] of (data.dimore.elenco || []).entries()) {
  d.flip = i % 2 === 1 ? 'flip' : ''
  d.anteprime = (d.galleria || []).slice(0, 3).map((foto, i) => ({ foto, i }))
  d.galleria_json = JSON.stringify((d.galleria || []).map(rel))
  d.n_foto = (d.galleria || []).length
}
for (const s of data.esperienze.sezioni || []) {
  for (const [i, v] of (s.voci || []).entries()) v.flip = i % 2 === 1 ? 'flip' : ''
}

// ─── build ───────────────────────────────────────────────────────────────────
const partials = {}
for (const f of readdirSync(join(SRC, '_partials'))) partials[f.replace('.html', '')] = parseTpl(readFileSync(join(SRC, '_partials', f), 'utf8'))

rmSync(DIST, { recursive: true, force: true })
mkdirSync(DIST, { recursive: true })
cpSync(join(ROOT, 'public'), DIST, { recursive: true })
cpSync(join(ROOT, 'admin'), join(DIST, 'admin'), { recursive: true })
writeFileSync(join(DIST, '.nojekyll'), '')

let pages = 0
for (const f of readdirSync(SRC)) {
  if (!f.endsWith('.html')) continue
  const page = f.replace('.html', '')
  const ctx = { ...data, is_home: page === 'index', page }
  const html = render(parseTpl(readFileSync(join(SRC, f), 'utf8')).children, [{ value: ctx, n: 0 }], partials)
  const residui = [...new Set(html.match(/\{\{[^}]*\}\}/g) || [])]
  if (residui.length) console.warn(`⚠ ${f}: token non risolti ${residui.join(' ')}`)
  writeFileSync(join(DIST, f), html, 'utf8')
  pages++
}
console.log(`✔ ${pages} pagine generate in dist/`)
