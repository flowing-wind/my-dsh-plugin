/** Published packages must install without the source workspace. */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
test('independent release entries and versioned market sources', () => {
  const index=JSON.parse(fs.readFileSync('market/index.json'))
  const dirs=fs.readdirSync('dist/plugins')
  assert.equal(index.plugins.length,dirs.length)
  for(const dir of dirs) {
    const base='dist/plugins/'+dir
    const pkg=JSON.parse(fs.readFileSync(base+'/package.json'))
    assert.match(pkg.name,/^@flowing-wind\/dsh-/)
    assert.equal(pkg.engines.dsh,'0.2.1-rc.2')
    assert.doesNotMatch(JSON.stringify(pkg),/workspace:|link:|\/home\/dsh/)
    assert.ok(fs.existsSync(base+'/'+pkg.dsh.bundle.patch))
    if(pkg.main)assert.ok(fs.existsSync(base+'/'+pkg.main))
    const row=index.plugins.find(p=>p.name===pkg.name)
    assert.match(row.versions[0].source.commit,/^[a-f0-9]{40}$/)
    assert.equal(row.versions[0].source.path,base)
  }
})
test('login protects boot and mobile navigation uses the official theme', () => {
  const login=fs.readFileSync('plugins/page-login/assets/login.js','utf8')
  assert.match(login,/__DSH_BOOT_READY__/)
  assert.match(login,/response\.ok/)
  assert.doesNotMatch(login,/glass|wallpaper|backdrop-filter/)
  const mobile=fs.readFileSync('plugins/mobile-layout/src/client/view.tsx','utf8')
  assert.match(mobile,/ctx\.layout\.toggleSidebar/)
  assert.doesNotMatch(mobile,/glass/)
})
