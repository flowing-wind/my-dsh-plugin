import { describe, expect, it } from 'vitest'
import { estimateTokenCost, pricingPeriod } from '../src/pricing.ts'

describe('request pricing', () => {
  it.each([
    ['2026-09-21T08:59:59+08:00', 'offPeak'],
    ['2026-09-21T09:00:00+08:00', 'peak'],
    ['2026-09-21T12:00:00+08:00', 'offPeak'],
    ['2026-09-21T14:00:00+08:00', 'peak'],
    ['2026-09-21T18:00:00+08:00', 'offPeak'],
    ['2026-09-20T10:00:00+08:00', 'offPeak'],
  ])('classifies Beijing time %s as %s', (timestamp, expected) => {
    expect(pricingPeriod(Date.parse(timestamp), { holidays: [] })).toBe(expected)
  })

  it('applies the holiday calendar during weekday peak hours', () => {
    expect(pricingPeriod(Date.parse('2026-10-01T10:00:00+08:00'), {
      holidays: ['2026-10-01'],
    })).toBe('offPeak')
  })

  it('charges cache hits separately and includes cache writes in input', () => {
    expect(estimateTokenCost({
      inputTokens: 1_000_000, outputTokens: 1_000_000,
      cacheReadTokens: 1_000_000, cacheWriteTokens: 500_000,
    }, { input: 2, cacheRead: 0.04, output: 8 })).toBe(11.04)
  })
})
