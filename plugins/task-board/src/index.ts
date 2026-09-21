/** Durable server-side scheduled prompts, independent of browser connections. */
import type { Context } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { defineDomain } from '@deepseek-ai/dsh-storage-domain'
import { SessionId } from '@deepseek-ai/dsh-session'
import { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import type { SessionRequestId } from '@deepseek-ai/dsh-api-session-controller/types'
import type {} from '@deepseek-ai/dsh-api-session-controller'
import type {} from '@deepseek-ai/dsh-client-connection'

/** Server polling period. */
export interface Config { pollMs: number }
/** Deployment scheduling cadence. */
export const Config: schema<Config> = schema.object({ pollMs: schema.natural().min(100).required() })
/** Durable state, workspace ownership, prompt admission, and authenticated transport. */
export const inject = ['storageDomain', 'workspaceRegistry', 'sessionController', 'connection']
const taskSchema = z.object({ id: z.string(), title: z.string(), workspaceId: z.string(), prompt: z.string(), nextAt: z.number(), repeatDays: z.union([z.literal(0), z.literal(1), z.literal(7)]), enabled: z.boolean(), status: z.enum(['scheduled', 'dispatching', 'submitted', 'error']), sessionId: z.string().nullable(), requestId: z.string().nullable(), error: z.string().nullable() })
const stateSchema = z.object({ tasks: z.array(taskSchema) })
const domainSpec = defineDomain({ name: 'task_board', version: 1, global: { schema: stateSchema, initial: { tasks: [] } }, tables: {} })
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), title: z.string().trim().min(1), workspaceId: z.string(), prompt: z.string().trim().min(1), nextAt: z.number().finite(), repeatDays: z.union([z.literal(0), z.literal(1), z.literal(7)]) }),
  z.object({ action: z.enum(['pause', 'resume', 'delete', 'run']), id: z.string() }),
])

/** @param ctx - Host services. @param config - Scheduler polling cadence. */
export async function apply(ctx: Context, config: Config): Promise<void> {
  const domain = await ctx.storageDomain.open(domainSpec)
  const lifetime = new AbortController()
  let serial: Promise<unknown> = Promise.resolve()
  const enqueue = <T,>(work: () => Promise<T>): Promise<T> => {
    const next = serial.then(() => { lifetime.signal.throwIfAborted(); return work() })
    serial = next.catch(() => { /* Each caller receives its operation failure. */ })
    return next
  }
  const dispatch = async () => {
    const tasks = domain.global.get().tasks.map(task => ({ ...task }))
    for (const task of tasks) {
      if (!task.enabled || task.nextAt > Date.now()) continue
      lifetime.signal.throwIfAborted()
      try {
        if (!ctx.workspaceRegistry.get(WorkspaceId(task.workspaceId))) throw new Error('Scheduled workspace no longer exists')
        if (task.status !== 'dispatching') {
          task.sessionId = `session-${randomUUID()}`
          task.requestId = randomUUID()
          task.status = 'dispatching'
          await domain.global.set({ tasks })
        }
        const created = await ctx.sessionController.create({ workspaceId: WorkspaceId(task.workspaceId), sessionId: SessionId(task.sessionId!) })
        await ctx.sessionController.rename({ sessionId: created.sessionId, title: task.title })
        await ctx.sessionController.prompt({ sessionId: created.sessionId, requestId: task.requestId! as SessionRequestId, mode: 'queue', content: [{ type: 'text', text: task.prompt }], clientTimeZone: 'Asia/Shanghai' }, lifetime.signal)
        task.status = 'submitted'; task.error = null
        if (task.repeatDays === 0) task.enabled = false
        else {
          const interval = task.repeatDays * 86400000
          task.nextAt += (Math.floor((Date.now() - task.nextAt) / interval) + 1) * interval
        }
      } catch (error) {
        if (lifetime.signal.aborted) throw error
        task.status = 'error'; task.error = String(error); task.enabled = false
      }
      await domain.global.set({ tasks })
    }
  }
  let ticking = false
  const tick = () => {
    if (ticking) return
    ticking = true
    void enqueue(dispatch).catch(error => { if (!lifetime.signal.aborted) ctx.logger.error('Scheduled task dispatch failed', error) }).finally(() => { ticking = false })
  }
  const timer = setInterval(tick, config.pollMs)
  ctx.effect(() => async () => { clearInterval(timer); lifetime.abort(); await serial; await domain.close() })
  ctx.connection.fetch.register({ path: '/api/task-board', methods: ['GET', 'POST'], requestBody: 'buffered', fetch: async request => {
    try {
      if (request.method === 'POST') {
        const action = actionSchema.parse(await request.json())
        await enqueue(async () => {
          let tasks = domain.global.get().tasks.map(task => ({ ...task }))
          if (action.action === 'create') {
            if (!ctx.workspaceRegistry.get(WorkspaceId(action.workspaceId))) throw new Error('Workspace not found')
            tasks.push({ id: randomUUID(), title: action.title, workspaceId: action.workspaceId, prompt: action.prompt, nextAt: action.nextAt, repeatDays: action.repeatDays, enabled: true, status: 'scheduled', sessionId: null, requestId: null, error: null })
          } else {
            const task = tasks.find(item => item.id === action.id)
            if (!task) throw new Error('Task not found')
            if (action.action === 'delete') tasks = tasks.filter(item => item !== task)
            else if (action.action === 'pause') task.enabled = false
            else { task.enabled = true; task.error = null; task.status = 'scheduled'; if (action.action === 'run') task.nextAt = Date.now() }
          }
          await domain.global.set({ tasks })
        })
        tick()
      }
      return Response.json({ ...domain.global.get(), workspaces: ctx.workspaceRegistry.list().map(w => ({ id: w.id, title: w.title })), sessions: (await ctx.sessionController.list({}, request.signal)).items.map(s => ({ id: s.sessionId, running: s.running, cwd: s.cwd })) }, { headers: { 'cache-control': 'no-store' } })
    } catch (error) { return new Response(String(error), { status: 400 }) }
  } })
  tick()
}
