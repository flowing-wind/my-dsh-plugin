/** Compatibility files belong to the same user-installable workspace bundle. */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const base = 'dist/plugins/workspace-management'
test('one standard-host package contains the matching management providers', () => {
  const pkg = JSON.parse(fs.readFileSync(base + '/package.json'))
  assert.equal(pkg.version, '1.0.5')
  assert.equal(pkg.dshMarket.serverBuild, false)
  assert.ok(pkg.peerDependencies['@deepseek-ai/node-addon-system'])
  for (const name of ['session-controller', 'session-persistence-jsonl', 'ui-workspace']) {
    const provider = base + '/compat/' + name
    const meta = JSON.parse(fs.readFileSync(provider + '/package.json'))
    assert.equal(meta.version, pkg.engines.dsh)
    assert.ok(fs.existsSync(provider + '/lib/index.js'))
    if (meta.dsh?.client) {
      const registrations = []
      vm.runInNewContext(fs.readFileSync(provider + '/lib/client.js', 'utf8'), {
        window: { __ModuleLoader__: { load: entry => registrations.push(entry.id) } },
      })
      assert.deepEqual(registrations, [meta.name])
    }
  }
  assert.ok(fs.existsSync(base + '/compat/session-persistence-jsonl/lib/worker.cjs'))
})
