/** Browser validation for independently mounted traffic accounting. */
import { z } from 'zod'

const counters = z.object({ incomingBytes: z.number(), outgoingBytes: z.number(), cny: z.number() })
/** Current traffic report and confirmation coordinates. */
export const trafficSnapshotSchema = z.object({
  sessions: z.record(z.string(), counters), totals: counters,
  daily: z.object({ day: z.string(), outgoingBytes: z.number(), acknowledgedSteps: z.number() }),
  dailyCny: z.number(), windowCny: z.number(), throttled: z.boolean(), requiredStep: z.number().nullable(),
  storageError: z.boolean(),
  throttleDisabled: z.boolean(),
  policy: z.object({
    cnyPerGB: z.number(), windowMs: z.number(), windowCny: z.number(), throttledMbps: z.number(),
    dailyStepCny: z.number(), refreshMs: z.number().positive(), checkpointMs: z.number(),
  }),
})
/** Parsed network dashboard report. */
export type TrafficSnapshot = z.infer<typeof trafficSnapshotSchema>
