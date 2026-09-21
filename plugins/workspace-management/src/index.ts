/** Optional authenticated deletion of conversations and workspace registrations. */
import type { Context } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { z } from 'zod'
import { realpath, rename, rm } from 'node:fs/promises'
import { isAbsolute, relative, resolve, dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { SessionId } from '@deepseek-ai/dsh-session'
import { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import type {} from '@deepseek-ai/dsh-api-session-controller'
import type {} from '@deepseek-ai/dsh-client-connection'

/** Explicit root whose child workspace directories can be permanently removed. */
export interface Config {
  /** Existing absolute directory whose child workspaces may be deleted from disk. */
  managedWorkspaceRoot: string
}
/** Directory deletion is restricted to children of this configured root. */
export const Config: schema<Config> = schema.object({ managedWorkspaceRoot: schema.string().required() })
/** Existing persistence, Agent ownership, and authenticated transport services. */
export const inject = ['connection', 'sessionController', 'workspaceRegistry', 'sessionPersistence']

function below(root: string, path: string): boolean {
  const child = relative(root, path)
  return child !== '' && child !== '..' && !child.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(child)
}

/**
 * Mount management endpoints independently of billing and file browsing.
 * @param ctx - Host service context.
 * @param config - Directory deletion policy.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  if (!isAbsolute(config.managedWorkspaceRoot)) throw new Error('managedWorkspaceRoot must be absolute')
  const root = await realpath(config.managedWorkspaceRoot)
  ctx.connection.fetch.register({
    path: '/api/workspace-management', methods: ['GET'], requestBody: 'buffered',
    fetch: async request => Response.json({
      sessions: (await ctx.sessionController.list({}, request.signal)).items.map(item => ({ id: item.sessionId, cwd: item.cwd, running: item.running })),
      workspaces: ctx.workspaceRegistry.list().map(item => ({ id: item.id, title: item.title, path: item.path, canDeleteFiles: below(root, item.path) })),
    }, { headers: { 'cache-control': 'no-store' } }),
  })
  ctx.connection.fetch.register({
    path: '/api/workspace-management.delete', methods: ['POST'], requestBody: 'buffered',
    fetch: async request => {
      try {
        const parsed = z.discriminatedUnion('kind', [
          z.object({ kind: z.literal('session'), id: z.string().min(1), confirmed: z.literal(true) }),
          z.object({ kind: z.literal('workspace'), id: z.string().min(1), confirmed: z.literal(true), deleteFiles: z.boolean(), deleteSessions: z.boolean() }),
        ]).safeParse(await request.json())
        if (!parsed.success) return new Response('Explicit deletion confirmation is required', { status: 400 })
        const selected = parsed.data
        if (selected.kind === 'session') {
          const id = SessionId(selected.id)
          await ctx.sessionController.deleteSession(id)
          await ctx.workspaceRegistry.unarchiveSession(id)
          for (const workspace of ctx.workspaceRegistry.list()) await workspace.detachSession(id)
        } else {
          const id = WorkspaceId(selected.id)
          const workspace = ctx.workspaceRegistry.get(id)
          if (workspace === undefined) return new Response('Workspace not found', { status: 404 })
          const target = resolve(workspace.path)
          if (selected.deleteFiles && (await realpath(target) !== target || !below(root, target))) return new Response('Directory is outside the configured removable workspace root', { status: 403 })
          const headers = await ctx.sessionPersistence.list()
          const sessions = headers.filter(item => workspace.sessionIds.includes(item.header.id) || item.header.cwd !== undefined && (resolve(item.header.cwd) === target || below(target, resolve(item.header.cwd)))).map(item => item.header.id)
          if (selected.deleteSessions) {
            const owned = headers.filter(item => workspace.sessionIds.includes(item.header.id) || item.header.cwd !== undefined && resolve(item.header.cwd) === target).map(item => item.header.id)
            for (const sessionId of owned) {
              await ctx.sessionController.deleteSession(sessionId)
              await ctx.workspaceRegistry.unarchiveSession(sessionId)
              for (const owner of ctx.workspaceRegistry.list()) await owner.detachSession(sessionId)
            }
          }
          if (selected.deleteFiles) {
            await ctx.sessionController.withSessionsStopped(sessions, async () => {
              const detached = join(dirname(target), `.dsh-delete-${randomUUID()}`)
              await rename(target, detached)
              await rm(detached, { recursive: true })
              await ctx.workspaceRegistry.delete(id)
            })
          } else await ctx.workspaceRegistry.delete(id)
        }
        return Response.json({ deleted: true })
      } catch (error) {
        return new Response(error instanceof Error ? error.message : String(error), { status: 500 })
      }
    },
  })
}
