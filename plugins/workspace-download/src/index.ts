/** Authenticated, streamed downloads using the existing workspace filesystem provider. */
import type { Context } from '@deepseek-ai/cordis'
import { SessionId } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-api-workspace-files'
import type {} from '@deepseek-ai/dsh-client-connection'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { basename } from 'node:path'
import schema from '@deepseek-ai/schemastery'
import { registerArchives, type ArchiveConfig } from './archive-route.ts'

/** Folder ZIP storage and confirmation settings. */
export type Config = ArchiveConfig
/** Explicit deployment archive settings. */
export const Config: schema<Config> = schema.object({ archiveDirectory: schema.string().required(), confirmationBytes: schema.natural().min(1).required(), archiveLifetimeMs: schema.natural().min(1).required() })

/** Required authenticated carrier and existing file-read policy. */
export const inject = ['connection', 'workspaceFiles', 'sessions', 'sessionPersistence']

/**
 * Register a download route with bounded reads and cancellation.
 * @param ctx - Authenticated Web context and composed filesystem.
 */
export function apply(ctx: Context, config: Config): void {
  registerArchives(ctx, config)
  ctx.inject(['systemPrompt'], promptCtx => {
    promptCtx.systemPrompt.section({
      name: 'workspace-download:deliveries',
      order: promptCtx.systemPrompt.getSectionOrder('WEB_SURFACE'),
      text: () => 'When the user requests a file, save the finished file in the workspace and call the present tool with its path. The browser shows preview and download actions for presented files. Do not use a server desktop application to deliver a file to the user.',
    })
  })
  ctx.connection.fetch.register({
    path: '/api/workspace-download', methods: ['GET'], requestBody: 'buffered',
    fetch: async request => {
      const query = new URL(request.url).searchParams
      const rawId = query.get('sessionId')
      const path = query.get('path')
      if (!rawId || !path) return new Response('Session and file path are required', { status: 400 })
      const sessionId = SessionId(rawId)
      const header = ctx.sessions.get(sessionId)?.header ?? (await ctx.sessionPersistence.stat(sessionId))?.header
      if (header?.cwd === undefined) return new Response('Workspace session not found', { status: 404 })
      const scope = { sessionId, workspaceRoot: header.cwd }
      const initial = await ctx.workspaceFiles.stat(scope, path, request.signal)
      const cancellation = new AbortController()
      const signal = AbortSignal.any([request.signal, cancellation.signal])
      let offset = 0
      const body = new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const chunk = await ctx.workspaceFiles.readBytes(scope, path, { offset }, signal)
            if (chunk.version !== initial.version) throw new Error('File changed during download; retry after writing finishes')
            const bytes = Buffer.from(chunk.data, 'base64')
            offset += bytes.length
            if (bytes.length > 0) controller.enqueue(bytes)
            if (chunk.eof) controller.close()
          } catch (error) { cancellation.abort(error); controller.error(error) }
        },
        cancel(reason) { cancellation.abort(reason) },
      })
      return new Response(body, { headers: {
        'content-type': 'application/octet-stream',
        'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(basename(initial.absolutePath)).replace(/'/g, '%27')}`,
        'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
        ...(initial.bytes === undefined ? {} : { 'content-length': String(initial.bytes) }),
      } })
    },
  })
}
