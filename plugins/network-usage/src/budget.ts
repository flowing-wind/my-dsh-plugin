/** Public-egress accounting and explicitly acknowledged calendar-day spending thresholds. */

/** Deployment policy; money is CNY and bandwidth is decimal Mbps. */
export interface TrafficPolicy {
  /** CNY charged per decimal GB of outgoing traffic. */
  cnyPerGB: number
  /** Rolling observation window in milliseconds. */
  windowMs: number
  /** Outgoing cost strictly above this amount activates throttling. */
  windowCny: number
  /** Shared outgoing rate during throttling, in decimal Mbps. */
  throttledMbps: number
  /** Additional CNY requiring confirmation within each Beijing calendar day. */
  dailyStepCny: number
}

/** Durable daily accounting; acknowledgements apply to one Beijing calendar day. */
export interface DailyTraffic {
  day: string
  outgoingBytes: number
  acknowledgedSteps: number
}

/**
 * Resolve the billing date independently of the machine's timezone.
 * @param now - Unix milliseconds.
 * @returns Beijing calendar date.
 */
export function billingDay(now: number): string {
  return new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/**
 * Convert public egress to a decimal-GB charge estimate.
 * @param bytes - Counted outbound bytes.
 * @param cnyPerGB - Configured CNY per 1,000,000,000 bytes.
 * @returns Unrounded CNY estimate.
 */
export function trafficCost(bytes: number, cnyPerGB: number): number {
  return bytes / 1_000_000_000 * cnyPerGB
}

/** Process-local rolling window backed by a separately persisted daily record. */
export class TrafficBudget {
  private readonly samples: { time: number; bytes: number }[]
  private windowBytes = 0
  private daily: DailyTraffic
  private throttleDisabled = false

  /** @param policy - Explicit price and thresholds. @param daily - Restored daily accounting. @param samples - Restored rolling-window observations. */
  constructor(private readonly policy: TrafficPolicy, daily: DailyTraffic, samples: readonly { time: number; bytes: number }[] = []) {
    this.daily = { ...daily }
    this.samples = samples.map(sample => ({ ...sample }))
    this.windowBytes = this.samples.reduce((sum, sample) => sum + sample.bytes, 0)
  }

  /**
   * Record actual outgoing bytes, coalescing same-millisecond samples.
   * @param bytes - Successfully transmitted bytes.
   * @param now - Observation time in Unix milliseconds.
   */
  record(bytes: number, now: number): void {
    this.advance(now)
    this.daily.outgoingBytes += bytes
    this.windowBytes += bytes
    const last = this.samples.at(-1)
    if (last?.time === now) last.bytes += bytes
    else this.samples.push({ time: now, bytes })
  }

  /**
   * Read the current daily record and enforcement decisions.
   * @param now - Unix milliseconds.
   * @returns A detached daily record, current window cost, and required acknowledgement tier.
   */
  snapshot(now: number): {
    daily: DailyTraffic; windowCny: number; throttled: boolean; throttleDisabled: boolean; requiredStep: number | null
  } {
    this.advance(now)
    const windowCny = trafficCost(this.windowBytes, this.policy.cnyPerGB)
    const reachedStep = Math.floor(trafficCost(this.daily.outgoingBytes, this.policy.cnyPerGB) / this.policy.dailyStepCny)
    return {
      daily: { ...this.daily }, windowCny,
      throttled: windowCny > this.policy.windowCny && !this.throttleDisabled,
      throttleDisabled: this.throttleDisabled,
      requiredStep: reachedStep > this.daily.acknowledgedSteps ? reachedStep : null,
    }
  }

  /**
   * Disable pacing for the current over-budget episode; process restart clears this override.
   * @param now - Unix milliseconds.
   * @returns Whether an active throttle was disabled.
   */
  disableThrottle(now: number): boolean {
    if (!this.snapshot(now).throttled) return false
    this.throttleDisabled = true
    return true
  }

  /**
   * Acknowledge exactly the warning currently shown to the user.
   * @param day - Date displayed in the confirmation.
   * @param step - Spending tier displayed in the confirmation.
   * @param now - Unix milliseconds.
   * @returns Whether the confirmation still names the active warning.
   */
  acknowledge(day: string, step: number, now: number): boolean {
    const state = this.snapshot(now)
    if (day !== state.daily.day || step !== state.requiredStep) return false
    this.daily.acknowledgedSteps = step
    return true
  }

  /**
   * Copy the retained rolling observations.
   * @returns Detached observations for the next durable checkpoint.
   */
  observations(): { time: number; bytes: number }[] {
    return this.samples.map(sample => ({ ...sample }))
  }

  private advance(now: number): void {
    const day = billingDay(now)
    if (day !== this.daily.day) this.daily = { day, outgoingBytes: 0, acknowledgedSteps: 0 }
    const cutoff = now - this.policy.windowMs
    let expired = 0
    for (const sample of this.samples) {
      if (sample.time > cutoff) break
      this.windowBytes -= sample.bytes
      expired++
    }
    if (expired > 0) this.samples.splice(0, expired)
    if (trafficCost(this.windowBytes, this.policy.cnyPerGB) <= this.policy.windowCny) this.throttleDisabled = false
  }
}
