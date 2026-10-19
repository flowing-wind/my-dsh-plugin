import fs from 'node:fs'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const harness=path.resolve(process.argv[2])
const {parseMarketIndex,marketInstallTarget}=await import(pathToFileURL(path.join(harness,'packages/util/plugin-market-index/lib/index.js')))
const {apply}=await import(pathToFileURL(path.join(harness,'packages/experimental/personal-instructions/lib/index.js')))
const repo=path.resolve(import.meta.dirname,'..')
const temporary=path.resolve(process.argv[3])
assert.match(temporary,/[\\/]\.codex[\\/]/)
fs.mkdirSync(temporary,{recursive:true})
const market=parseMarketIndex(JSON.parse(fs.readFileSync(repo+'/market/index.json')),'https://raw.githubusercontent.com/flowing-wind/my-dsh-plugin/main/market/index.json')
assert.equal(market.plugins.length,17)
for(const plugin of market.plugins)assert.match(marketInstallTarget(plugin.name,plugin.versions[0]).spec,/#\w{40}&path:\/dist\/plugins\//)
assert.throws(()=>parseMarketIndex({...market,plugins:[{...market.plugins[0],versions:[{...market.plugins[0].versions[0],source:{type:'git',url:'https://github.com/flowing-wind/my-dsh-plugin',commit:'bad'}}]}]},'https://example.com/index.json'))
let route, section, changed=0
const file=path.join(fs.mkdtempSync(path.join(temporary,'personal-')),'agent.md')
const ctx={systemPrompt:{getSectionOrder:()=>1,section:v=>{section=v;return ()=>{}}},effect:fn=>fn(),connection:{fetch:{register:v=>{route=v;return async()=>{}}}},emit:()=>{changed++}}
await apply(ctx,{path:path.relative(os.homedir(),file),maxBytes:1024})
const send=body=>route.fetch(new Request('http://localhost/api/personal-instructions',{method:'POST',body}))
assert.equal((await send('{')).status,400)
assert.equal((await send(JSON.stringify({content:'界'.repeat(342)}))).status,413)
assert.equal((await send(JSON.stringify({content:'Global instructions check'}))).status,204)
assert.equal(fs.readFileSync(file,'utf8'),'Global instructions check')
assert.match(section.text(),/Global instructions check/)
assert.equal(changed,1)
assert.equal((fs.statSync(file).mode&0o777),0o600)
console.log('Official format-1 validation and personal-instruction write checks passed')

fs.rmSync(path.dirname(file),{recursive:true})
