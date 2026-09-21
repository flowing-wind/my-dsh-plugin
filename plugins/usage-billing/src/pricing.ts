/** CNY estimates from provider token buckets and a dated deployment price table. */

/** CNY prices for one million tokens; input excludes cache hits. */
export interface TokenPrices {
  /** CNY per million uncached input tokens, including cache writes. */
  input: number
  /** CNY per million cached input tokens. */
  cacheRead: number
  /** CNY per million generated output tokens. */
  output: number
}

/** Explicit pricing calendar; dates use Asia/Shanghai YYYY-MM-DD. */
export interface PricingCalendar {
  /** Beijing holiday dates excluded from peak pricing, formatted YYYY-MM-DD. */
  holidays: readonly string[]
}

/** Disjoint provider token counts, including cache writes charged as input. */
export interface BillableUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
}

/**
 * Classify a request by Beijing weekday and the provider's peak windows.
 * @param timestamp - Request start in Unix milliseconds.
 * @param calendar - Published holiday dates supplied by the deployment.
 * @returns The tariff period at request start.
 */
export function pricingPeriod(timestamp: number, calendar: PricingCalendar): 'peak' | 'offPeak' {
  const beijing = new Date(timestamp + 8 * 60 * 60 * 1000)
  const day = beijing.getUTCDay()
  const hour = beijing.getUTCHours()
  const date = beijing.toISOString().slice(0, 10)
  return day >= 1 && day <= 5 && !calendar.holidays.includes(date)
    && ((hour >= 9 && hour < 12) || (hour >= 14 && hour < 18))
    ? 'peak' : 'offPeak'
}

/**
 * Estimate one request without rounding individual token buckets.
 * @param usage - Provider-reported disjoint token buckets.
 * @param prices - Prices for the request's model and tariff period.
 * @returns Estimated CNY; the provider's balance remains authoritative.
 */
export function estimateTokenCost(usage: BillableUsage, prices: TokenPrices): number {
  return ((usage.inputTokens + (usage.cacheWriteTokens ?? 0)) * prices.input
    + (usage.cacheReadTokens ?? 0) * prices.cacheRead
    + usage.outputTokens * prices.output) / 1_000_000
}
