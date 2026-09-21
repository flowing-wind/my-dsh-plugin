/** Estimate locally incurred Session charges from durable request and settlement events. */
import { lastAssistantStreamChunk } from '@deepseek-ai/dsh-llm'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-llm-retry/types'
import { estimateTokenCost, pricingPeriod } from './pricing.ts'
import type { BillableUsage, PricingCalendar, TokenPrices } from './pricing.ts'

/** One dated price generation, selected by request start time. */
export interface PriceGeneration extends PricingCalendar {
  /** Adapter identifier whose reported usage uses these prices. */
  provider: string
  /** Inclusive effective time as Unix milliseconds. */
  effectiveAt: number
  /** Beijing holiday dates excluded from peak pricing, formatted YYYY-MM-DD. */
  holidays: string[]
  /** Model identifiers mapped to prices for both billing periods. */
  models: Record<string, {
    /** Weekday peak-period prices. */
    peak: TokenPrices
    /** Prices outside peak hours and on holidays. */
    offPeak: TokenPrices
  }>
}

/** Session estimate excludes inherited fork history and identifies unpriced requests. */
export interface SessionEstimate {
  cny: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  unpricedRequests: number
}

/**
 * Fold reported usage, retaining the provider's replacement semantics within an attempt.
 * @param events - Complete ordered logical Session events.
 * @param inheritedEventCount - Fork prefix already billed to another Session.
 * @param generations - Price generations ordered by increasing effectiveAt.
 * @param day - Optional Beijing billing date to include, formatted YYYY-MM-DD.
 * @returns Local token counts and an estimate, with missing prices explicitly counted.
 */
export function estimateSession(
  events: readonly SessionEvent[], inheritedEventCount: number, generations: readonly PriceGeneration[], day?: string,
): SessionEstimate {
  const totals: SessionEstimate = {
    cny: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, unpricedRequests: 0,
  }
  let model = ''
  let provider = ''
  let startedAt = 0
  let last: { turn: number; step: number; usage: BillableUsage; cost: number | undefined } | undefined
  const add = (usage: BillableUsage, cost: number | undefined, sign: number): void => {
    totals.inputTokens += sign * usage.inputTokens
    totals.outputTokens += sign * usage.outputTokens
    totals.cacheReadTokens += sign * (usage.cacheReadTokens ?? 0)
    totals.cacheWriteTokens += sign * (usage.cacheWriteTokens ?? 0)
    totals.cny += sign * (cost ?? 0)
    totals.unpricedRequests += sign * (cost === undefined ? 1 : 0)
  }
  for (const event of events) {
    if (event.type === 'request/header') {
      model = event.data.header.config.model
      provider = event.data.header.config.provider
    }
    if (event.type === 'step/start' || event.type === 'llm/retry-started') startedAt = event.time
    if (event.seq < inheritedEventCount) continue
    if (event.type === 'llm/retry-started') last = undefined
    if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt') continue
    const usage = event.type === 'assistant/message' && event.data.usage !== undefined
      ? event.data.usage : lastAssistantStreamChunk(event.data.stream, 'usage')?.usage
    if (usage === undefined) continue
    if (day !== undefined && billingDate(startedAt) !== day) continue
    const { turn, step } = event.data
    if (last?.turn === turn && last.step === step) add(last.usage, last.cost, -1)
    const generation = generations.findLast(item => item.effectiveAt <= startedAt)
    const prices = provider === generation?.provider ? generation.models[model] : undefined
    const cost = generation !== undefined && prices !== undefined
      ? estimateTokenCost(usage, prices[pricingPeriod(startedAt, generation)]) : undefined
    add(usage, cost, 1)
    last = { turn, step, usage, cost }
  }
  return totals
}

/** @param time - Unix milliseconds. @returns Beijing calendar date. */
export function billingDate(time: number): string {
  return new Date(time + 28_800_000).toISOString().slice(0, 10)
}

/**
 * Group reported usage by the request's Beijing start date.
 * @param events - Ordered Session events.
 * @param inheritedEventCount - Already billed fork prefix.
 * @param generations - Configured price history.
 * @returns Per-day token counts and estimated charges.
 */
export function estimateDays(events: readonly SessionEvent[], inheritedEventCount: number, generations: readonly PriceGeneration[]): Record<string, SessionEstimate> {
  const days = new Set(events.filter(event => event.seq >= inheritedEventCount && (event.type === 'step/start' || event.type === 'llm/retry-started')).map(event => billingDate(event.time)))
  return Object.fromEntries([...days].map(day => [day, estimateSession(events, inheritedEventCount, generations, day)]))
}
