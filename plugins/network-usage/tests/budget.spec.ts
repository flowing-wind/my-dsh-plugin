import { describe, expect, it } from 'vitest'
import { billingDay, TrafficBudget, trafficCost } from '../src/budget.ts'

const policy = { cnyPerGB: 0.8, windowMs: 600_000, windowCny: 0.5, throttledMbps: 2, dailyStepCny: 10 }
const now = Date.parse('2026-09-21T12:00:00+08:00')
const budget = () => new TrafficBudget(policy, { day: billingDay(now), outgoingBytes: 0, acknowledgedSteps: 0 })

describe('public-egress budget', () => {
  it('uses the supplied example and decimal GB', () => {
    expect(trafficCost(15_500_000_000, 0.8)).toBe(12.4)
  })

  it('throttles above 0.5 CNY and clears after the rolling window expires', () => {
    const meter = budget()
    meter.record(625_000_000, now)
    expect(meter.snapshot(now).throttled).toBe(false)
    meter.record(1, now + 1)
    expect(meter.snapshot(now + 1).throttled).toBe(true)
    expect(meter.snapshot(now + 600_000).throttled).toBe(false)
  })

  it('requires another confirmation at each additional 10 CNY', () => {
    const meter = budget()
    meter.record(12_500_000_001, now)
    expect(meter.snapshot(now).requiredStep).toBe(1)
    expect(meter.acknowledge(billingDay(now), 1, now)).toBe(true)
    expect(meter.snapshot(now).requiredStep).toBeNull()
    meter.record(12_500_000_000, now + 1)
    expect(meter.snapshot(now + 1).requiredStep).toBe(2)
    expect(meter.acknowledge(billingDay(now), 1, now + 1)).toBe(false)
  })

  it('disables only the current excess without acknowledging daily spending', () => {
    const meter = budget()
    expect(meter.disableThrottle(now)).toBe(false)
    meter.record(12_500_000_000, now)
    expect(meter.disableThrottle(now)).toBe(true)
    expect(meter.snapshot(now)).toMatchObject({ throttled: false, throttleDisabled: true, requiredStep: 1 })
    meter.record(1, now + 1)
    expect(meter.snapshot(now + 1).throttleDisabled).toBe(true)
    expect(meter.snapshot(now + 600_000)).toMatchObject({ throttled: false, throttleDisabled: false })
    meter.record(625_000_000, now + 600_001)
    expect(meter.snapshot(now + 600_001).throttled).toBe(false)
    meter.record(1, now + 600_002)
    expect(meter.snapshot(now + 600_002).throttled).toBe(true)
  })

  it('resets the daily threshold at Beijing midnight without clearing the rolling window', () => {
    const before = Date.parse('2026-09-21T23:59:59+08:00')
    const meter = budget()
    meter.record(13_000_000_000, before)
    const state = meter.snapshot(before + 1_000)
    expect(state.daily).toEqual({ day: '2026-09-22', outgoingBytes: 0, acknowledgedSteps: 0 })
    expect(state.requiredStep).toBeNull()
    expect(state.throttled).toBe(true)
    expect(meter.acknowledge('2026-09-21', 1, before + 1_000)).toBe(false)
  })
})
