/** Validated values shared by the billing endpoint and its browser plugin. */
import { z } from 'zod'

/** Token totals and estimated CNY shared by daily and lifetime counters. */
export const billingTotalsSchema = z.object({
  cny: z.number().nonnegative(), inputTokens: z.number().nonnegative(),
  outputTokens: z.number().nonnegative(), cacheReadTokens: z.number().nonnegative(),
  cacheWriteTokens: z.number().nonnegative(), unpricedRequests: z.number().int().nonnegative(),
})

/** Per-Session details; legacy ledgers acquire daily buckets when their logs are replayed. */
export const billingRecordSchema = billingTotalsSchema.extend({
  updatedAt: z.number(), days: z.record(z.string(), billingTotalsSchema).default({}),
})

/** Provider balance response, without credentials or other account data. */
export const balanceSchema = z.object({
  is_available: z.boolean(),
  balance_infos: z.array(z.object({
    currency: z.string(), total_balance: z.string(), granted_balance: z.string(), topped_up_balance: z.string(),
  })),
})

/** Authenticated dashboard response. */
export const billingSnapshotSchema = z.object({
  sessions: z.record(z.string(), billingRecordSchema),
  totals: billingTotalsSchema,
  daily: billingTotalsSchema, day: z.string(),
  balance: z.object({ fetchedAt: z.number(), value: balanceSchema }).optional(),
  balanceError: z.string().optional(),
  period: z.enum(['peak', 'offPeak', 'unknown']),
  refreshMs: z.number().int().positive(),
})

/** Parsed browser response. */
export type BillingSnapshot = z.infer<typeof billingSnapshotSchema>
