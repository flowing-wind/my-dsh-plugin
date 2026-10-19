/** Home-scoped personal instructions exposed to the model and settings UI. */
import type { Context } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { homedir } from 'node:os'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { mkdir, readFile } from 'node:fs/promises'
import { writeFileAtomic } from '@deepseek-ai/dsh-atomic-write'
import type {} from '@deepseek-ai/dsh-client-connection'
import type {} from '@deepseek-ai/dsh-system-prompt'

/** Personal instruction file configuration. */
export interface Config {
  /** Home-relative path of the shared personal instruction file. */
  path: string
  /** Maximum UTF-8 instruction size in bytes. */
  maxBytes: number
}
/** Personal instruction files remain below the service account home directory. */
export const Config: schema<Config> = schema.object({
  path: schema.string().default('.dsh/agent.md'),
  maxBytes: schema.natural().min(1024).default(131072),
})
/** Required prompt and HTTP services. */
export const inject = ['systemPrompt', 'connection']

/** @param ctx - Prompt and authenticated connection lifecycle. @param config - Home-relative storage settings. */
export async function apply(ctx: Context, config: Config): Promise<void> {
  const home = resolve(homedir())
  const file = resolve(home, config.path)
  const fromHome = relative(home, file)
  if (isAbsolute(fromHome) || fromHome === '..' || fromHome.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
    throw new Error('personal-instructions: path must stay below the user home directory')
  }
  await mkdir(dirname(file), { recursive: true })
  let content = await readFile(file, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return ''
    throw error
  })
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'deployment:personal-instructions',
    order: ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_SUFFIX'),
    text: () => content.trim() === '' ? '' : `# Personal instructions\n\n${content.trim()}`,
  }))
  ctx.connection.fetch.register({ path: '/api/personal-instructions', methods: ['GET', 'POST'], requestBody: 'buffered', fetch: async request => {
    const headers = { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' }
    if (request.method === 'GET') return new Response(JSON.stringify({ content }), { headers })
    const body = await request.text()
    if (Buffer.byteLength(body) > config.maxBytes + 1024) return new Response(null, { status: 413 })
    let input: unknown
    try { input = JSON.parse(body) } catch (_error) { return new Response(null, { status: 400 }) }
    if (typeof input !== 'object' || input === null || !('content' in input) || typeof input.content !== 'string') return new Response(null, { status: 400 })
    const next = input.content
    if (Buffer.byteLength(next) > config.maxBytes) return new Response(null, { status: 413 })
    await writeFileAtomic(file, next, { mode: 0o600 })
    content = next
    ctx.emit('system-prompt/change')
    return new Response(null, { status: 204, headers })
  } })
}
