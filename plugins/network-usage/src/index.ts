/** Optional durable public-traffic totals, spending confirmations, and shared egress pacing. */
import { Context, Service } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { z } from 'zod'
import { setTimeout as delay } from 'node:timers/promises'
import { defineDomain } from '@deepseek-ai/dsh-storage-domain'
import type {} from '@deepseek-ai/dsh-client-connection'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type { SessionId } from '@deepseek-ai/dsh-session'
import { billingDay, TrafficBudget, trafficCost } from './budget.ts'
import type { TrafficPolicy } from './budget.ts'
import { meterBrowserTransfers } from './browser-transfer.ts'

/** Aggregate transfer ownership, including agentless Host requests. */
export type TrafficOwner = SessionId | 'host'

const counters = z.object({ incomingBytes: z.number().nonnegative(), outgoingBytes: z.number().nonnegative() })
const stateSchema = z.object({
  sessions: z.record(z.string(), counters),
  retired: counters.default({ incomingBytes: 0, outgoingBytes: 0 }),
  daily: z.object({ day: z.string(), outgoingBytes: z.number().nonnegative(), acknowledgedSteps: z.number().int().nonnegative() }),
  samples: z.array(z.object({ time: z.number(), bytes: z.number().nonnegative() })),
})

/** Persistent totals remain independent of Session and Workspace deletion. */
export const trafficDomain = defineDomain({
  name: 'network_usage', version: 1,
  global: { schema: stateSchema, initial: { sessions: {}, retired: { incomingBytes: 0, outgoingBytes: 0 }, daily: { day: '', outgoingBytes: 0, acknowledgedSteps: 0 }, samples: [] } },
  tables: {},
})

/** Explicit deployment traffic policy and checkpoint frequency. */
export interface Config extends TrafficPolicy {
  /** Maximum normal interval between persisted traffic checkpoints, in milliseconds. */
  checkpointMs: number
  /** Browser dashboard refresh interval in milliseconds. */
  refreshMs: number
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    networkUsage: NetworkUsage
  }
}

/** Shared meter for proxy and browser transfers; confirmations never consume a model turn. */
export class NetworkUsage extends Service {
  static inject = ['storageDomain', 'connection', 'agents', 'sessionPersistence']
  static Config: schema<Config> = schema.object({
    cnyPerGB: schema.number().min(0.000001).required(), windowMs: schema.natural().min(1).required(),
    windowCny: schema.number().min(0.000001).required(), throttledMbps: schema.number().min(0.000001).required(),
    dailyStepCny: schema.number().min(0.000001).required(), checkpointMs: schema.natural().min(1).required(),
    refreshMs: schema.natural().min(1).required(),
  })

  private budget!: TrafficBudget
  private sessions: z.infer<typeof stateSchema>['sessions'] = {}
  private retired = { incomingBytes: 0, outgoingBytes: 0 }
  private readonly lifetime = new AbortController()
  private readonly waiting = new Set<() => void>()
  private nextSendAt = 0
  private throttleRelease = new AbortController()
  private checkpoint: () => Promise<void> = () => Promise.resolve()
  private checkpointError: unknown

  /** @param ctx - Storage, authenticated transport, and Agent events. @param config - Deployment spending policy. */
  constructor(ctx: Context, private readonly config: Config) {
    super(ctx, 'networkUsage')
  }

  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(trafficDomain)
    const state = domain.global.get()
    this.sessions = structuredClone(state.sessions)
    this.retired = { ...state.retired }
    this.budget = new TrafficBudget(this.config, state.daily, state.samples)
    meterBrowserTransfers(this.ctx)
    this.checkpoint = () => domain.global.set({
      sessions: structuredClone(this.sessions), daily: this.budget.snapshot(Date.now()).daily,
      samples: this.budget.observations(),
      retired: { ...this.retired },
    }).catch((error: unknown) => {
      this.checkpointError = error
      for (const wake of this.waiting) wake()
      throw error
    })
    const timer = setInterval(() => {
      void this.checkpoint().catch((error: unknown) => {
        this.ctx.logger.error('network-usage checkpoint failed', error)
      })
    }, this.config.checkpointMs)
    this.ctx.effect(() => async () => {
      clearInterval(timer)
      this.lifetime.abort()
      for (const wake of this.waiting) wake()
      await this.checkpoint()
      await domain.close()
    })
    this.ctx.on('agent/pre-step', async ({ signal }, next) => {
      await this.allow(signal)
      return next()
    })
    this.ctx.connection.fetch.register({
      path: '/api/network-usage', methods: ['GET'], requestBody: 'buffered',
      fetch: async () => {
        const live = new Set((await this.ctx.sessionPersistence.list()).map(item => String(item.header.id)))
        let changed = false
        for (const [id, value] of Object.entries(this.sessions)) {
          if (id === 'host' || live.has(id)) continue
          this.retired.incomingBytes += value.incomingBytes
          this.retired.outgoingBytes += value.outgoingBytes
          delete this.sessions[id]
          changed = true
        }
        if (changed) await this.checkpoint()
        return Response.json(this.snapshot(), { headers: { 'cache-control': 'no-store' } })
      },
    })
    this.ctx.connection.fetch.register({
      path: '/api/network-usage.disable-throttle', methods: ['POST'], requestBody: 'buffered',
      fetch: () => {
        if (!this.budget.disableThrottle(Date.now())) return Promise.resolve(new Response('No active throttle; refresh the dashboard', { status: 409 }))
        this.throttleRelease.abort()
        this.throttleRelease = new AbortController()
        this.nextSendAt = 0
        return Promise.resolve(Response.json(this.snapshot()))
      },
    })
    this.ctx.connection.fetch.register({
      path: '/api/network-usage.confirm', methods: ['POST'], requestBody: 'buffered',
      fetch: async (request) => {
        const parsed = z.object({ day: z.string(), step: z.number().int().positive() }).safeParse(await request.json())
        if (!parsed.success) return new Response('Invalid confirmation', { status: 400 })
        if (!this.budget.acknowledge(parsed.data.day, parsed.data.step, Date.now())) return new Response('The spending warning changed; refresh before confirming', { status: 409 })
        await this.checkpoint()
        for (const wake of this.waiting) wake()
        return Response.json(this.snapshot())
      },
    })
  }

  /**
   * Wait for the current spending warning to be acknowledged, or for midnight reset.
   * @param signal - Owning transfer or Agent cancellation.
   */
  async allow(signal: AbortSignal): Promise<void> {
    const cancellation = AbortSignal.any([signal, this.lifetime.signal])
    cancellation.throwIfAborted()
    if (this.checkpointError !== undefined) throw this.checkpointError
    while (this.budget.snapshot(Date.now()).requiredStep !== null) {
      await new Promise<void>((resolve, reject) => {
        const wake = (): void => { cleanup(); resolve() }
        const abort = (): void => { cleanup(); reject(cancellation.reason) }
        const tomorrow = Date.parse(`${billingDay(Date.now())}T00:00:00+08:00`) + 86_400_000
        const timer = setTimeout(wake, Math.max(1, tomorrow - Date.now()))
        const cleanup = (): void => { clearTimeout(timer); this.waiting.delete(wake); cancellation.removeEventListener('abort', abort) }
        this.waiting.add(wake)
        cancellation.addEventListener('abort', abort, { once: true })
        if (cancellation.aborted) abort()
      })
      cancellation.throwIfAborted()
      if (this.checkpointError !== undefined) throw this.checkpointError
    }
  }

  /**
   * Apply spending consent and one shared throttle across outgoing streams.
   * @param bytes - Next bounded chunk length.
   * @param signal - Transfer cancellation.
   */
  async pace(bytes: number, signal: AbortSignal): Promise<void> {
    await this.allow(signal)
    const now = Date.now()
    if (!this.budget.snapshot(now).throttled) return
    const start = Math.max(now, this.nextSendAt)
    this.nextSendAt = start + bytes * 8 / (this.config.throttledMbps * 1_000)
    const release = this.throttleRelease.signal
    try {
      await delay(this.nextSendAt - now, undefined, { signal: AbortSignal.any([signal, this.lifetime.signal, release]) })
    } catch (error) {
      if (!release.aborted) throw error
    }
    await this.allow(signal)
  }

  /**
   * Account bytes transferred at a proxy or browser carrier.
   * @param owner - Session identity or agentless Host traffic.
   * @param direction - Direction relative to the server.
   * @param bytes - Transferred payload bytes, excluding IP/TCP retransmission overhead.
   */
  record(owner: TrafficOwner, direction: 'incoming' | 'outgoing', bytes: number): void {
    const row = this.sessions[owner] ??= { incomingBytes: 0, outgoingBytes: 0 }
    if (direction === 'incoming') row.incomingBytes += bytes
    else {
      row.outgoingBytes += bytes
      this.budget.record(bytes, Date.now())
    }
  }

  /**
   * Read dashboard counters and policy decisions.
   * @returns Detached lifetime totals and current enforcement state.
   */
  snapshot(): object {
    const state = this.budget.snapshot(Date.now())
    const sessions = Object.fromEntries(Object.entries(this.sessions).map(([id, value]) => [id, {
      ...value, cny: trafficCost(value.outgoingBytes, this.config.cnyPerGB),
    }]))
    const totals = Object.values(this.sessions).reduce((sum, row) => ({
      incomingBytes: sum.incomingBytes + row.incomingBytes, outgoingBytes: sum.outgoingBytes + row.outgoingBytes,
    }), { ...this.retired })
    return {
      sessions, totals: { ...totals, cny: trafficCost(totals.outgoingBytes, this.config.cnyPerGB) },
      ...state, dailyCny: trafficCost(state.daily.outgoingBytes, this.config.cnyPerGB),
      policy: this.config, storageError: this.checkpointError !== undefined,
    }
  }
}

export default NetworkUsage
