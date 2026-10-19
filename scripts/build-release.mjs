/** Assemble independently installable packages from a matching, built Harness checkout. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const harness = path.resolve(process.argv[2] ?? '.')
const upstream = JSON.parse(fs.readFileSync(path.join(repo, 'upstream.json')))
if (JSON.parse(fs.readFileSync(path.join(harness, 'package.json'))).version !== upstream.version) throw Error('Build the matching Harness version first')
const output = path.join(repo, 'dist/plugins')
const version = '1.0.4'
const versions = new Map()
for (const group of fs.readdirSync(path.join(harness, 'packages'))) {
  const dir = path.join(harness, 'packages', group)
  if (!fs.statSync(dir).isDirectory()) continue
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name, 'package.json')
    if (fs.existsSync(file)) { const p = JSON.parse(fs.readFileSync(file)); versions.set(p.name, p.version) }
  }
}
for (const name of fs.readdirSync(path.join(harness, 'vendor'))) {
  const file = path.join(harness, 'vendor', name, 'package.json')
  if (fs.existsSync(file)) { const p = JSON.parse(fs.readFileSync(file)); versions.set(p.name, p.version) }
}
const details = {
  'compact-layout': ['紧凑右侧面板与官方标识', 'layout', false],
  'account-balance': ['API Key 余额', 'tools', false],
  'workspace-download': ['文件下载与 ZIP', 'server', true],
  'workspace-management': ['会话与工作区管理', 'server', true],
  'workspace-editor': ['工作区文本编辑', 'server', true],
  'workspace-pages': ['文件与网页预览', 'server', true],
  'interactive-results': ['交互表格、图表与表单', 'tools', false],
  'mobile-layout': ['手机导航与触控布局', 'layout', true],
  'page-login': ['服务器页面登录', 'server', true],
  'personal-instructions': ['全局个性化说明', 'tools', false],
}
const json = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
for (const [name, [title, category, serverBuild]] of Object.entries(details)) {
  const source = path.join(repo, 'plugins', name)
  const built = path.join(harness, 'packages/experimental', name)
  const destination = path.join(output, name)
  fs.mkdirSync(destination, { recursive: true })
  const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json')))
  const originalName = pkg.name
  for (const section of ['dependencies', 'peerDependencies']) {
    for (const [dependency, spec] of Object.entries(pkg[section] ?? {})) {
      if (spec.startsWith('workspace:')) {
        if (!versions.has(dependency)) throw Error('Unknown workspace dependency: ' + dependency)
        pkg[section][dependency] = versions.get(dependency)
      }
    }
  }
  pkg.name = '@flowing-wind/dsh-' + name
  pkg.version = version
  pkg.engines = { dsh: upstream.version }
  pkg.repository = { type: 'git', url: 'https://github.com/flowing-wind/my-dsh-plugin.git', directory: 'dist/plugins/' + name }
  pkg.dshMarket = { title, category, serverBuild }
  delete pkg.scripts
  delete pkg.devDependencies
  delete pkg.publishConfig
  for (const entry of ['lib', 'assets', 'locale', 'README.md', 'README.zh.md']) {
    const from = entry === 'lib' ? path.join(built, entry) : path.join(source, entry)
    if (fs.existsSync(from)) fs.cpSync(from, path.join(destination, entry), { recursive: true })
  }
  const client = path.join(destination, 'lib/client.js')
  if (fs.existsSync(client)) fs.writeFileSync(client, fs.readFileSync(client, 'utf8').replaceAll(originalName, pkg.name))
  fs.writeFileSync(path.join(destination, 'cordis.patch.yml'), fs.readFileSync(path.join(source, 'cordis.patch.yml'), 'utf8').replaceAll(originalName, pkg.name))
  json(path.join(destination, 'package.json'), pkg)
  fs.copyFileSync(path.join(repo, 'LICENSE'), path.join(destination, 'LICENSE'))
}
for (const name of fs.readdirSync(output)) {
  const file = path.join(output, name, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(file))
  for (const [dependency, spec] of Object.entries(pkg.dependencies ?? {})) {
    if (!dependency.startsWith('@deepseek-ai/dsh-')) continue
    pkg.peerDependencies ??= {}
    pkg.peerDependencies[dependency] = spec
    delete pkg.dependencies[dependency]
  }
  pkg.version = version
  json(file, pkg)
}
console.log('Built', Object.keys(details).length, 'code plugins; skill and configuration bundles retain their pinned release files')
