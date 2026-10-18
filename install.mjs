import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const base = path.dirname(fileURLToPath(import.meta.url))
const target = path.resolve(process.argv[2] || '.')
const meta = JSON.parse(fs.readFileSync(path.join(base, 'upstream.json'), 'utf8'))
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: target, encoding: 'utf8' }).trim()
if (head !== meta.commit) throw new Error(`Expected upstream commit ${meta.commit}; found ${head}`)
const patch = path.join(base, 'patches/harness.patch')
execFileSync('git', ['apply', '--check', patch], { cwd: target, stdio: 'inherit' })
for (const name of meta.plugins) {
  fs.cpSync(path.join(base, 'plugins', name), path.join(target, 'packages/experimental', name), { recursive: true })
}
fs.cpSync(path.join(base, 'extras'), target, { recursive: true })
execFileSync('git', ['apply', patch], { cwd: target, stdio: 'inherit' })
console.log('Source installed. Run pnpm install and pnpm run build:artifacts in the Harness checkout.')
