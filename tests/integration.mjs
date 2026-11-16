import fs from 'node:fs'
import assert from 'node:assert/strict'
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
let route
const home = fs.mkdtempSync(path.join(temporary, 'personal-'))
const file = path.join(home, 'AGENTS.md')
const { loadBaselineInstructions } = await import(pathToFileURL(path.join(harness, 'packages/context/agent-instructions/lib/index.js')))
process.env.DSH_HOME = home
process.env.DSH_AGENTS_HOME = path.join(home, 'shared')
const ctx = { effect: register => register(), connection: { fetch: { register: value => {
  route = value
  return async () => {}
} } } }
apply(ctx, { maxBytes: 1024 })
const url = 'http://localhost/api/personal-instructions'
const read = async () => (await route.fetch(new Request(url))).json()
const send = body => route.fetch(new Request(url, { method: 'POST', body }))
const initial = await read()
assert.equal(initial.content, '')
assert.equal((await send('{')).status, 400)
assert.equal((await send(JSON.stringify({ revision: initial.revision, content: '界'.repeat(342) }))).status, 413)
const written = await send(JSON.stringify({ revision: initial.revision, content: 'Global instructions check' }))
assert.equal(written.status, 200)
const saved = await written.json()
assert.deepEqual(await read(), { content: 'Global instructions check', revision: saved.revision })
assert.equal(fs.readFileSync(file, 'utf8'), 'Global instructions check')
const native = await loadBaselineInstructions({ cwd: home, maxBytes: 8192 })
assert.match(native.text, /Instructions from: \$DSH_HOME\/AGENTS\.md\n\nGlobal instructions check/)
fs.writeFileSync(file, 'Externally edited')
assert.equal((await read()).content, 'Externally edited')
assert.equal((await send(JSON.stringify({ revision: saved.revision, content: 'Stale draft' }))).status, 409)
assert.equal(fs.readFileSync(file, 'utf8'), 'Externally edited')
assert.equal((fs.statSync(file).mode & 0o777), 0o600)
console.log('Official index parsing, global AGENTS.md editing, conflict handling, and native loading passed')
fs.rmSync(home, { recursive: true })
