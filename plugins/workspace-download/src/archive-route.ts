/** Two-phase directory downloads with server-enforced size confirmation. */
import type { Context } from '@deepseek-ai/cordis'
import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import { SessionId } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-client-connection'
import type {} from '@deepseek-ai/dsh-session-persistence'
import { archiveDirectory } from './archive.ts'

/** Temporary archive retention and explicit browser confirmation policy. */
export interface ArchiveConfig { archiveDirectory: string; confirmationBytes: number; archiveLifetimeMs: number }
interface Archive { directory: string; file: string; name: string; bytes: number; sessionId: string; confirmed: boolean; timer: ReturnType<typeof setTimeout> }

/** @param ctx - Authenticated connection and durable Sessions. @param config - Archive storage and confirmation policy. */
export function registerArchives(ctx: Context, config: ArchiveConfig): void {
  if (!isAbsolute(config.archiveDirectory)) throw new Error('archiveDirectory must be an absolute path')
  const lifetime = new AbortController()
  const archives = new Map<string, Archive>()
  const pending = new Set<Promise<unknown>>()
  let preparing = false
  const remove = async (id: string) => {
    const archive = archives.get(id)
    if (!archive) return
    archives.delete(id); clearTimeout(archive.timer)
    await rm(archive.directory, { recursive: true, force: true })
  }
  ctx.effect(() => async () => {
    lifetime.abort()
    await Promise.allSettled([...pending])
    await Promise.all([...archives.keys()].map(remove))
  })
  ctx.connection.fetch.register({ path: '/api/workspace-archive', methods: ['POST', 'GET'], requestBody: 'buffered', fetch: async request => {
    const query = new URL(request.url).searchParams
    const sessionId = query.get('sessionId')
    if (!sessionId) return new Response('Conversation is required', { status: 400 })
    const signal = AbortSignal.any([request.signal, lifetime.signal])
    if (request.method === 'POST' && query.get('action') === 'prepare') {
      if (preparing) return new Response('Another folder is being compressed; retry after it finishes', { status: 409 })
      preparing = true
      const prepare = async () => {
        let directory: string | undefined
        try {
          const input: unknown = await request.json()
          if (typeof input !== 'object' || input === null || !('path' in input) || typeof input.path !== 'string') return new Response('Folder path is required', { status: 400 })
          const session = await ctx.sessionPersistence.stat(SessionId(sessionId))
          if (!session?.header.cwd) return new Response('Conversation workspace not found', { status: 404 })
          const root = await realpath(session.header.cwd)
          const target = await realpath(resolve(root, input.path))
          const child = relative(root, target)
          if (child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child)) return new Response('Folder must be inside this workspace', { status: 403 })
          await mkdir(config.archiveDirectory, { recursive: true, mode: 0o700 })
          const storage = await realpath(config.archiveDirectory)
          const withinSource = relative(target, storage)
          if (withinSource === '' || (withinSource !== '..' && !withinSource.startsWith(`..${sep}`) && !isAbsolute(withinSource))) return new Response('Archive storage must be outside the downloaded folder', { status: 400 })
          directory = await mkdtemp(join(config.archiveDirectory, 'zip-'))
          const file = join(directory, 'download.zip')
          const result = await archiveDirectory(root, target, file, signal)
          signal.throwIfAborted()
          const id = randomUUID()
          const requiresConfirmation = result.bytes > config.confirmationBytes
          const timer = setTimeout(() => { void remove(id).catch(error => console.error('Archive cleanup failed', error)) }, config.archiveLifetimeMs)
          timer.unref()
          archives.set(id, { directory, file, name: basename(target) + '.zip', bytes: result.bytes, sessionId, confirmed: !requiresConfirmation, timer })
          directory = undefined
          return Response.json({ id, ...result, requiresConfirmation }, { headers: { 'cache-control': 'no-store' } })
        } catch (error) { return new Response(String(error), { status: 400 }) }
        finally { try { if (directory) await rm(directory, { recursive: true, force: true }) } finally { preparing = false } }
      }
      const task = prepare(); pending.add(task)
      try { return await task } finally { pending.delete(task) }
    }
    const id = query.get('id')
    const archive = id ? archives.get(id) : undefined
    if (!id || !archive || archive.sessionId !== sessionId) return new Response('Archive expired or not found', { status: 404 })
    if (request.method === 'POST' && query.get('action') === 'cancel') { await remove(id); return new Response(null, { status: 204 }) }
    if (request.method === 'POST' && query.get('action') === 'confirm') {
      archive.confirmed = true
      return new Response(null, { status: 204 })
    }
    if (request.method !== 'GET') return new Response('Unknown archive action', { status: 400 })
    if (!archive.confirmed) return new Response('Confirm the compressed archive size before downloading', { status: 403 })
    clearTimeout(archive.timer)
    archives.delete(id)
    const stream = createReadStream(archive.file, { signal })
    const finished = new Promise<void>(resolveDone => {
      stream.once('close', () => {
        void rm(archive.directory, { recursive: true, force: true }).catch(error => console.error('Archive cleanup failed', error)).finally(resolveDone)
      })
    })
    pending.add(finished); void finished.finally(() => pending.delete(finished))
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { headers: {
      'content-type': 'application/zip', 'content-length': String(archive.bytes),
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(archive.name).replace(/'/g, '%27')}`,
      'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
    } })
  } })
}
