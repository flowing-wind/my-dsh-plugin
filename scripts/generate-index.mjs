/** Generate a commit-pinned index for the published Git subdirectories. */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const commit = process.env.DSH_PLUGIN_COMMIT ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Expected a full Git commit')
const repository = 'https://github.com/flowing-wind/my-dsh-plugin'
const timestamp = Math.floor(Date.now() / 1000)
const previous = existsSync('market/index.json') ? JSON.parse(readFileSync('market/index.json')).plugins : []
const plugins = readdirSync('dist/plugins').sort().map(directory => {
  const p = JSON.parse(readFileSync('dist/plugins/' + directory + '/package.json'))
  const known = previous.find(row => row.name === p.name)?.versions ?? []
  const current = known.find(row => row.version === p.version) ?? { version: p.version, publishTimestamp: timestamp,
    source: { type: 'git', url: repository, commit, path: 'dist/plugins/' + directory }, engines: p.engines }
  return { name: p.name, title: p.dshMarket.title, description: p.description, author: 'flowing-wind',
    homepage: repository + '#plugins', repository: { url: repository, directory: 'dist/plugins/' + directory },
    metadata: { category: p.dshMarket.category, labels: p.dshMarket.serverBuild ? ['server-build'] : ['standard-host'] },
    versions: [current, ...known.filter(row => row.version !== p.version)] }
})
const index = { format: 1, title: { en: 'Flowing Wind plugins', zh: 'Flowing Wind 插件' },
  metadata: {
    categories: Object.fromEntries([['tools','功能'],['layout','布局'],['skills','技能'],['server','服务器']].map(([id,zh]) => [id,{title:{en:id,zh}}])),
    labels: { 'server-build': { title: { en: 'Matching server build', zh: '配套服务器构建' } },
      'standard-host': { title: { en: 'Official Host', zh: '官方宿主' } } }
  }, plugins }
mkdirSync('market', {recursive:true})
writeFileSync('market/index.json', JSON.stringify(index,null,2) + '\n')
console.log('Indexed', plugins.length, 'plugins at', commit)
