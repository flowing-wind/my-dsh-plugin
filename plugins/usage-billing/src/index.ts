/** Optional CNY usage ledger and authenticated balance endpoint for the Web profile. */
import { Context, Service } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { z } from 'zod'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { KvTable, DomainGlobal } from '@deepseek-ai/dsh-storage-domain'
import type { SessionId } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type {} from '@deepseek-ai/dsh-api-session-controller'
import type {} from '@deepseek-ai/dsh-client-connection'
import { estimateSession, estimateDays, billingDate } from './estimate.ts'
import type { PriceGeneration, SessionEstimate } from './estimate.ts'
import { pricingPeriod } from './pricing.ts'
import { balanceSchema, billingRecordSchema as record, billingTotalsSchema } from './wire.ts'

const price = schema.object({ input: schema.number().min(0).required(), cacheRead: schema.number().min(0).required(), output: schema.number().min(0).required() })

/** Deployment prices and bounded balance refresh settings. */
export interface Config {
  /** Price versions ordered by strictly increasing effective time. */
  generations: PriceGeneration[]
  /** Credential reference used for balance requests. */
  apiKeyEnv: string
  /** HTTPS endpoint returning the provider account balance. */
  balanceUrl: string
  /** Minimum interval between balance refreshes, in milliseconds. */
  balanceCacheMs: number
  /** Balance request timeout in milliseconds. */
  requestTimeoutMs: number
  /** Browser refresh interval in milliseconds. */
  refreshMs: number
}

type BillingRecord = z.infer<typeof record>
const zero = (): SessionEstimate => ({ cny: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, unpricedRequests: 0 })
const add = (a: SessionEstimate, b: SessionEstimate): SessionEstimate => ({
  cny: a.cny + b.cny, inputTokens: a.inputTokens + b.inputTokens, outputTokens: a.outputTokens + b.outputTokens,
  cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens, cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
  unpricedRequests: a.unpricedRequests + b.unpricedRequests,
})
const retiredSchema = z.object({ totals: billingTotalsSchema, days: z.record(z.string(), billingTotalsSchema), pending: z.string().nullable() })

/** Durable per-Session totals survive deletion of the original conversation. */
export const billingDomain = defineDomain({
  name: 'usage_billing', version: 1,
  global: { schema: retiredSchema, initial: { totals: zero(), days: {}, pending: null } },
  tables: { sessions: domainTable<SessionId, BillingRecord>(record) },
})

/** Usage estimates with account balances fetched only by an authenticated browser request. */
export class UsageBilling extends Service {
  static inject = ['storageDomain', 'sessionPersistence', 'sessionController', 'sessions', 'credentials', 'connection']
  static Config: schema<Config> = schema.object({
    generations: schema.array(schema.object({
      provider: schema.string().required(),
      effectiveAt: schema.number().required(), holidays: schema.array(schema.string()).required(),
      models: schema.dict(schema.object({ peak: price.required(), offPeak: price.required() })).required(),
    })).required(),
    apiKeyEnv: schema.string().required(), balanceUrl: schema.string().required(),
    balanceCacheMs: schema.natural().min(1).required(), requestTimeoutMs: schema.natural().min(1).required(),
    refreshMs: schema.natural().min(1).required(),
  })

  private table!: KvTable<SessionId, BillingRecord>
  private retired!: DomainGlobal<z.infer<typeof retiredSchema>>
  private pruning = Promise.resolve()
  private readonly lifetime = new AbortController()
  private readonly pending = new Set<Promise<unknown>>()
  private readonly refreshes = new Map<SessionId, Promise<void>>()
  private balance: { fetchedAt: number; value: z.infer<typeof balanceSchema> } | undefined
  private balanceRequest: Promise<void> | undefined

  /** @param ctx - Host services. @param config - Explicit deployment prices and refresh limits. */
  constructor(ctx: Context, private readonly config: Config) {
    super(ctx, 'usageBilling')
    credentialRef(config.apiKeyEnv)
    const url = new URL(config.balanceUrl)
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('balanceUrl must be an HTTPS URL without user information')
    if (config.generations.length === 0 || config.generations.some((item, index) =>
      !Number.isFinite(item.effectiveAt) || index > 0 && item.effectiveAt <= config.generations[index - 1]!.effectiveAt)) {
      throw new Error('generations must have strictly increasing effectiveAt timestamps')
    }
  }

  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(billingDomain)
    this.table = domain.table('sessions')
    this.retired = domain.global
    this.ctx.effect(() => async () => {
      this.lifetime.abort()
      await Promise.allSettled(this.pending)
      await domain.close()
    })
    for (const snapshot of await this.ctx.sessionPersistence.list()) await this.refresh(snapshot.header.id)
    this.ctx.on('session/flush', session => this.enqueueRefresh(session.id))
    this.ctx.on('api-session/before-delete', async id => {
      await this.refreshes.get(id)
      if (await this.ctx.sessionPersistence.stat(id) !== undefined) await this.enqueueRefresh(id)
    })
    this.ctx.connection.fetch.register({
      path: '/api/usage-billing', methods: ['GET'], requestBody: 'buffered',
      fetch: () => this.track(this.snapshot()),
    })
  }

  private track<T>(task: Promise<T>): Promise<T> {
    this.pending.add(task)
    void task.then(() => this.pending.delete(task), () => this.pending.delete(task))
    return task
  }

  private async refresh(id: SessionId): Promise<void> {
    const inspection = await this.ctx.sessionController.inspect(id)
    const estimate = estimateSession(inspection.events, inspection.inheritedEventCount, this.config.generations)
    await this.table.put(id, { ...estimate, days: estimateDays(inspection.events, inspection.inheritedEventCount, this.config.generations), updatedAt: Date.now() })
  }

  private enqueueRefresh(id: SessionId): Promise<void> {
    const task = (this.refreshes.get(id) ?? Promise.resolve()).then(() => this.refresh(id))
    this.refreshes.set(id, task)
    const settled = (): void => { if (this.refreshes.get(id) === task) this.refreshes.delete(id) }
    void task.then(settled, settled)
    return this.track(task)
  }

  private async readBalance(): Promise<void> {
    const key = await this.ctx.credentials.resolve(credentialRef(this.config.apiKeyEnv))
    if (key === undefined) throw new Error('Balance credential is not configured')
    const response = await fetch(this.config.balanceUrl, {
      headers: { authorization: `Bearer ${key.value}` }, redirect: 'error',
      signal: AbortSignal.any([this.lifetime.signal, AbortSignal.timeout(this.config.requestTimeoutMs)]),
    })
    if (!response.ok) throw new Error(`Balance request failed with HTTP ${response.status}`)
    this.balance = { fetchedAt: Date.now(), value: balanceSchema.parse(await response.json()) }
  }

  private async snapshot(): Promise<Response> {
    const prune = this.pruning.then(async () => {
      const live = new Set((await this.ctx.sessionPersistence.list()).map(item => item.header.id))
      for (const [id, item] of this.table.entries()) {
        if (live.has(id)) continue
        const retired = this.retired.get()
        if (retired.pending !== id) {
          const days = { ...retired.days }
          for (const [day, usage] of Object.entries(item.days)) days[day] = add(days[day] ?? zero(), usage)
          await this.retired.set({ totals: add(retired.totals, item), days, pending: id })
        }
        await this.table.delete(id)
        await this.retired.set({ ...this.retired.get(), pending: null })
      }
    })
    this.pruning = prune.catch((error: unknown) => { /* The current HTTP request reports error; the next request may retry the queue. */ void error })
    await prune
    let balanceError: string | undefined
    if (this.balance === undefined || Date.now() - this.balance.fetchedAt >= this.config.balanceCacheMs) {
      this.balanceRequest ??= this.readBalance().finally(() => { this.balanceRequest = undefined })
      try { await this.balanceRequest }
      catch (error) { balanceError = error instanceof Error ? error.message : 'Balance request failed' }
    }
    const sessions = Object.fromEntries(this.table.entries())
    const totals = Object.values(sessions).reduce(add, this.retired.get().totals)
    const day = billingDate(Date.now())
    const daily = Object.values(sessions).reduce((sum, item) => add(sum, item.days[day] ?? zero()), this.retired.get().days[day] ?? zero())
    const generation = this.config.generations.findLast(item => item.effectiveAt <= Date.now())
    return Response.json({
      sessions, totals, day, daily, balance: this.balance, balanceError, refreshMs: this.config.refreshMs,
      period: generation === undefined ? 'unknown' : pricingPeriod(Date.now(), generation),
    }, { headers: { 'cache-control': 'no-store' } })
  }
}

export default UsageBilling
