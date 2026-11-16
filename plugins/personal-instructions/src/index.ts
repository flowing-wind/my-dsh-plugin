/** Authenticated settings access to the Harness global AGENTS.md file. */
import type { Context } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, realpath } from 'node:fs/promises'
import { dirname } from 'node:path'
import { withFileLock, writeFileAtomic } from '@deepseek-ai/dsh-atomic-write'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'
import type {} from '@deepseek-ai/dsh-client-connection'

/** Maximum size accepted by the settings editor. The native loader owns the prompt budget. */
export interface Config {
  /** Maximum UTF-8 file size in bytes. */
  maxBytes: number
}

/** Bounds writes to the authenticated settings endpoint. */
export const Config: schema<Config> = schema.object({
  maxBytes: schema.natural().min(1024).default(131072),
})

/** Required authenticated HTTP service. */
export const inject = ['connection']

function revisionOf(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

async function readInstructions(file: string) {
  const entry = await lstat(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined
    throw error
  })
  const target = entry?.isSymbolicLink() ? await realpath(file) : file
  const content = entry === undefined ? '' : await readFile(target, 'utf8')
  return { target, content, revision: revisionOf(content) }
}

/**
 * Register the editor for the same Harness home that native instruction loading uses.
 * @param ctx - Authenticated connection lifecycle.
 * @param config - Editor write limit.
 */
export function apply(ctx: Context, config: Config): void {
  const file = dshHomePath('AGENTS.md')
  const headers = { 'cache-control': 'no-store' }
  ctx.effect(() => ctx.connection.fetch.register({
    path: '/api/personal-instructions',
    methods: ['GET', 'POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      if (request.method === 'GET') {
        const { content, revision } = await readInstructions(file)
        return Response.json({ content, revision }, { headers })
      }
      const body = await request.text()
      if (Buffer.byteLength(body) > config.maxBytes * 6 + 128) return new Response(null, { status: 413 })
      let input: unknown
      try { input = JSON.parse(body) } catch (_error) { return new Response(null, { status: 400 }) }
      if (typeof input !== 'object' || input === null ||
        !('content' in input) || typeof input.content !== 'string' ||
        !('revision' in input) || typeof input.revision !== 'string') return new Response(null, { status: 400 })
      const { content, revision } = input
      if (Buffer.byteLength(content) > config.maxBytes) return new Response(null, { status: 413 })
      await mkdir(dirname(file), { recursive: true, mode: 0o700 })
      return withFileLock(file, async () => {
        const current = await readInstructions(file)
        if (current.revision !== revision) return new Response(null, { status: 409 })
        await writeFileAtomic(current.target, content, { mode: 0o600 })
        return Response.json({ revision: revisionOf(content) }, { headers })
      }, { signal: request.signal })
    },
  }))
}
