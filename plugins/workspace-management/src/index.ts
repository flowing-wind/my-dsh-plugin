/** Optional authenticated deletion of conversations and workspace registrations. */
import type { Context } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { z } from 'zod'
import { realpath, rm } from 'node:fs/promises'
import { isAbsolute, relative, resolve, dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'
import { below, canRemoveDirectory } from './paths.ts'
import { SessionId } from '@deepseek-ai/dsh-session'
import { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import type {} from '@deepseek-ai/dsh-api-session-controller'
import type {} from '@deepseek-ai/dsh-client-connection'

/** Optional administrator restriction on removable workspace directories. */
export interface Config {
  /** Existing absolute parent directory; omitted permits eligible registered directories. */
  managedWorkspaceRoot?: string
}
/** Explicit roots restrict deletion; protected directories are always excluded. */
export const Config: schema<Config> = schema.object({ managedWorkspaceRoot: schema.string() })
/** Existing persistence, Agent ownership, and authenticated transport services. */
export const inject = ['connection', 'sessionController', 'workspaceRegistry', 'sessionPersistence']

/**
 * Mount management endpoints independently of billing and file browsing.
 * @param ctx - Host service context.
 * @param config - Directory deletion policy.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  if (config.managedWorkspaceRoot !== undefined && !isAbsolute(config.managedWorkspaceRoot)) throw new Error('managedWorkspaceRoot must be absolute')
  const root = config.managedWorkspaceRoot === undefined ? undefined : await realpath(config.managedWorkspaceRoot)
  const home = await realpath(homedir())
  const systemTrees = process.platform === 'win32'
    ? [join(home, 'AppData'), ...['SystemRoot', 'ProgramFiles', 'ProgramFiles(x86)', 'ProgramData']
      .flatMap(key => process.env[key] === undefined ? [] : [process.env[key]])]
    : ['/etc', '/usr', '/var', '/boot', '/proc', '/sys', '/dev']
  const protectedTrees = [dshHomePath(), dirname(process.execPath), ...systemTrees].map(directory => resolve(directory))
  const removable = (directory: string) => canRemoveDirectory(directory, root, home, protectedTrees)
  ctx.connection.fetch.register({
    path: '/api/workspace-management', methods: ['GET'], requestBody: 'buffered',
    fetch: async request => Response.json({
      sessions: (await ctx.sessionController.list({}, request.signal)).items.map(item => ({
        id: item.sessionId, cwd: item.cwd, running: item.running,
      })),
      workspaces: await Promise.all(ctx.workspaceRegistry.list().map(async item => ({
        id: item.id, title: item.title, path: item.path, canDeleteFiles: await removable(item.path),
      }))),
    }, { headers: { 'cache-control': 'no-store' } }),
  })
  ctx.connection.fetch.register({
    path: '/api/workspace-management.delete', methods: ['POST'], requestBody: 'buffered',
    fetch: async (request) => {
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
          if (selected.deleteFiles && !await removable(target)) return new Response('Directory is protected, aliased, missing, or outside the configured removable workspace root', { status: 403 })
          const headers = await ctx.sessionPersistence.list()
          const sessions = headers.filter(item => workspace.sessionIds.includes(item.header.id) || item.header.cwd !== undefined && (relative(target, resolve(item.header.cwd)) === '' || below(target, resolve(item.header.cwd)))).map(item => item.header.id)
          if (selected.deleteSessions) {
            const owned = headers.filter(item => workspace.sessionIds.includes(item.header.id) || item.header.cwd !== undefined && relative(target, resolve(item.header.cwd)) === '').map(item => item.header.id)
            for (const sessionId of owned) {
              await ctx.sessionController.deleteSession(sessionId)
              await ctx.workspaceRegistry.unarchiveSession(sessionId)
              for (const owner of ctx.workspaceRegistry.list()) await owner.detachSession(sessionId)
            }
          }
          if (selected.deleteFiles) {
            await ctx.sessionController.withSessionsStopped(sessions, async () => {
              if (!await removable(target)) throw new Error('Workspace directory is no longer eligible for deletion')
              await rm(target, { recursive: true })
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
