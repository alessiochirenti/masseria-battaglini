// Dependency-free checks for all twenty pages. Run after build.mjs, including in CI.
import assert from 'node:assert/strict'
import {readFileSync, readdirSync, existsSync} from 'node:fs'
import {join, dirname, resolve, relative, isAbsolute} from 'node:path'
import {ROOT, languages, loadSource, catalog, dictionaries} from './i18n.mjs'

const source=loadSource(), dicts=dictionaries(source), dist=join(ROOT,'dist')
const ui=new Set(Object.values(source.ui))
const read=file=>readFileSync(file,'utf8')
const decode=text=>text.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
let checked=0

// New JavaScript interface strings must join the source catalog too.
for(const file of readdirSync(join(ROOT,'public/js')).filter(f=>f.endsWith('.js'))){
  for(const match of read(join(ROOT,'public/js',file)).matchAll(/\bt\(\s*(['"])(.*?)\1/g)){
    assert.ok(ui.has(match[2]),`${file}: UI string missing from content/ui.json: ${match[2]}`)
  }
}
// Simulate a future content edit: the build must reject untranslated additions.
assert.throws(()=>dictionaries({...source,translationCheck:'Nuovo testo di prova senza traduzioni'}),/Traduzioni .* mancanti/)
assert.ok(Object.keys(catalog(source)).length>300,'Full site catalog should be present')

for(const {code} of languages)for(const name of ['index','racconto','camere','esperienze']){
  const folder=code==='it'?'':code, file=join(dist,folder,name+'.html'), html=read(file)
  assert.ok(html.includes(`<html lang="${code}">`),`${file}: document language`)
  assert.ok(html.indexOf('<meta charset="utf-8">')<1024,`${file}: early UTF-8 declaration`)
  assert.ok(!/\{\{|\}\}/.test(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'')),`${file}: template syntax leaked`)
  const messages=JSON.parse(html.match(/<script type="application\/json" id="i18n-messages">([\s\S]*?)<\/script>/)[1])
  for(const text of ui)assert.equal(messages[text],code==='it'?text:dicts[code][text],`${file}: interface ${text}`)
  const base=source.site.url.replace(/\/?$/,'/')
  const page=name==='index'?'':name+'.html'
  assert.ok(html.includes(`rel="canonical" href="${base}${folder?folder+'/':''}${page}"`),`${file}: canonical`)
  for(const alt of [...languages.map(l=>l.code),'x-default']){
    const expected=base+(['it','x-default'].includes(alt)?'':alt+'/')+page
    assert.ok(html.includes(`hreflang="${alt}" href="${expected}"`),`${file}: alternate ${alt}`)
  }
  // Validate local page/media URLs and anchors, including lazy video, book and gallery media.
  const urls=[...html.matchAll(/\b(?:href|src|data-src|data-loop-src|poster)="([^"\n]*)"/g)].map(m=>decode(m[1]))
  for(const m of html.matchAll(/data-photos='([^']+)'/g))urls.push(...JSON.parse(decode(m[1])))
  for(const m of html.matchAll(/url\('([^']+)'\)/g))urls.push(decode(m[1]))
  for(const url of urls){
    assert.ok(url,`${file}: empty URL`)
    if(/^(?:https?:|mailto:|tel:|data:)/.test(url))continue
    const parsed=new URL(url,'https://local.test/'+(folder?folder+'/':'')+name+'.html')
    const target=resolve(dist,'.'+decodeURIComponent(parsed.pathname))
    const within=relative(dist,target)
    assert.ok(!within.startsWith('..')&&!isAbsolute(within),`${file}: URL escapes dist: ${url}`)
    assert.ok(existsSync(target),`${file}: missing local URL ${url}`)
    if(parsed.hash&&target.endsWith('.html'))assert.ok(read(target).includes(`id="${parsed.hash.slice(1)}"`),`${file}: missing anchor ${url}`)
  }
  // UI labels with names like "language"/"rating" must not be skipped as technical data.
  for(const key of ['language','rating','openMenu'])assert.ok(html.includes(decode(code==='it'?source.ui[key]:dicts[code][source.ui[key]])),`${file}: ${key}`)
  checked++
}
console.log(`✔ ${checked} pagine: lingue, cataloghi, interfaccia, URL, ancore, media e metadati coerenti.`)
