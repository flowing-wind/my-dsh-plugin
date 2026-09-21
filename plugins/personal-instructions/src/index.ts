/** Home-scoped personal instructions exposed to the model and settings UI. */
import type { Context } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { homedir } from 'node:os'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-client-connection'
import type {} from '@deepseek-ai/dsh-system-prompt'

/** Personal instruction file configuration. */
export interface Config { path: string; maxBytes: number }
/** Personal instruction files remain below the service account home directory. */
export const Config: schema<Config> = schema.object({
  path: schema.string().default('.dsh/agent.md'),
  maxBytes: schema.natural().min(1024).default(131072),
})
/** Required prompt and HTTP services. */
export const inject = ['systemPrompt', 'webServer', 'connection']

/** @param ctx - Prompt and web-server lifecycle. @param config - Home-relative storage settings. */
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
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/api/personal-instructions', handler: async (req, res) => {
    res.setHeader('cache-control', 'no-store')
    const rejection = ctx.connection.requestRejection(req)
    if (rejection !== undefined) { res.writeHead(rejection); res.end(); return }
    if (req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ content }))
      return
    }
    if (req.method !== 'PUT') { res.writeHead(405); res.end(); return }
    let body = ''
    for await (const chunk of req) {
      body += String(chunk)
      if (Buffer.byteLength(body) > config.maxBytes + 1024) { res.writeHead(413); res.end(); return }
    }
    let next: unknown
    try { next = (JSON.parse(body) as { content?: unknown }).content } catch { res.writeHead(400); res.end(); return }
    if (typeof next !== 'string' || Buffer.byteLength(next) > config.maxBytes) { res.writeHead(400); res.end(); return }
    const temporary = `${file}.tmp`
    await writeFile(temporary, next, { encoding: 'utf8', mode: 0o600 })
    await rename(temporary, file)
    content = next
    ctx.emit('system-prompt/change')
    res.writeHead(204); res.end()
  } }))
}
