/** Cache a fixed official Remotion skill revision and register it globally. */
import * as filesystem from '@deepseek-ai/dsh-skill-filesystem'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { withFileLock } from '@deepseek-ai/dsh-atomic-write'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
const run = promisify(execFile)
const revision = '1441a11e95db35443bd76bb318386c0d3ca00053'
export const inject = ['skills']
/** @param ctx - Owner of the global skill provider. */
export async function apply(ctx) {
  const abort = new AbortController()
  ctx.effect(() => () => abort.abort())
  const parent = join(resolveDshHome(), 'cache', 'flowing-wind', 'remotion')
  const directory = join(parent, revision)
  await mkdir(parent, { recursive: true })
  await withFileLock(directory, async () => {
    if (existsSync(directory)) return
    const temporary = await mkdtemp(join(parent, '.download-'))
    const checkout = join(temporary, 'repo')
    const git = args => run('git', args, { windowsHide: true, signal: abort.signal, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
    try {
      await git(['clone', '--quiet', '--depth', '1', '--filter=blob:none', '--sparse', '--no-checkout', 'https://github.com/remotion-dev/skills.git', checkout])
      await git(['-C', checkout, 'sparse-checkout', 'set', 'skills'])
      await git(['-C', checkout, 'fetch', '--quiet', '--depth', '1', 'origin', revision])
      await git(['-C', checkout, 'checkout', '--quiet', '--detach', revision])
      await rename(checkout, directory)
    } finally {
      await rm(temporary, { recursive: true, force: true })
    }
  })
  ctx.plugin(filesystem, { providerName: 'flowing-wind-skills-remotion', includeDefaultRoots: false, customSkillDirs: [join(directory, 'skills')], watch: false })
}
