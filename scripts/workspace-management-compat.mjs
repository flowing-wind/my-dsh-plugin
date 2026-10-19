/** Package the pinned Host providers and Workspace slot with one installable bundle. */
import fs from 'node:fs'
import path from 'node:path'

/**
 * Include the providers compiled from upstream.json plus patches/harness.patch.
 * @param harness - Matching built Harness checkout.
 * @param destination - Published workspace-management package.
 * @param pkg - Published manifest receiving the shared provider dependencies.
 * @param versions - Versions of packages in the matching checkout.
 */
export function includeManagementCompatibility(harness, destination, pkg, versions) {
  const providers = [
    ['session-controller', 'api/session-controller'],
    ['session-persistence-jsonl', 'session/session-persistence-jsonl'],
    ['ui-workspace', 'client/ui-workspace'],
  ]
  const patches = []
  const entries = []
  for (const [id, directory] of providers) {
    const source = path.join(harness, 'packages', directory)
    const manifest = JSON.parse(fs.readFileSync(path.join(source, 'package.json')))
    const target = path.join(destination, 'compat', id)
    fs.mkdirSync(path.join(target, 'lib'), { recursive: true })
    for (const file of fs.readdirSync(path.join(source, 'lib'))) {
      if (/\.(?:c?js|json)$/.test(file)) fs.copyFileSync(path.join(source, 'lib', file), path.join(target, 'lib', file))
    }
    for (const file of ['locale', 'assets']) {
      if (fs.existsSync(path.join(source, file))) fs.cpSync(path.join(source, file), path.join(target, file), { recursive: true })
    }
    fs.copyFileSync(path.join(harness, 'LICENSE'), path.join(target, 'LICENSE'))
    fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({
      name: manifest.name, version: manifest.version, type: 'module', license: manifest.license,
      main: 'lib/index.js', exports: Object.fromEntries(Object.entries(manifest.exports).filter(([key]) => key !== './src/*').map(([key, value]) => [key, typeof value === 'object' ? { default: value.default } : value])),
      ...(manifest.dsh ? { dsh: manifest.dsh } : {}),
    }, null, 2) + '\n')
    for (const [dependency, spec] of Object.entries({ ...manifest.dependencies, ...manifest.peerDependencies })) {
      const section = dependency.startsWith('@deepseek-ai/') ? 'peerDependencies' : 'dependencies'
      pkg[section] ??= {}
      const version = spec.startsWith('workspace:') ? versions.get(dependency) : spec
      if (version === undefined) throw Error('Unknown compatibility dependency: ' + dependency)
      pkg[section][dependency] = version
    }
    patches.push('- id: ' + id + '\n  disabled: true\n')
    entries.push('    - id: managed-' + id + '\n      name: ./compat/' + id + '/lib/index.js' +
      (id === 'session-persistence-jsonl' ? "\n      config:\n        root: !!js dshHomePath('sessions')" : '') +
      (id === 'session-controller' ? '\n      config:\n        defaultCwd: !!js process.env.DSH_WORKSPACE_ROOT' : '') + '\n')
  }
  pkg.files ??= []
  pkg.files.push('compat/**')
  const patchFile = path.join(destination, 'cordis.patch.yml')
  fs.writeFileSync(patchFile, patches.join('') + '- insert:\n' + entries.join('') + fs.readFileSync(patchFile, 'utf8'))
}
