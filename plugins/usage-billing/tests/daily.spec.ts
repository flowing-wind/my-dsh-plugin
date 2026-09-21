import { expect, it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { estimateDays, estimateSession } from '../src/estimate.ts'

it('assigns replacement usage to request-start dates across Beijing midnight', () => {
  const time = Date.parse('2026-09-21T23:59:59+08:00')
  const prices = { input: 2, cacheRead: 0.04, output: 8 }
  const generations = [{ provider: 'deepseek-official', effectiveAt: 0, holidays: [], models: { test: { peak: prices, offPeak: prices } } }]
  // Only fields read by accounting are populated; transport metadata is irrelevant to this fold.
  const events = [
    { seq: 0, time, type: 'request/header', data: { header: { config: { model: 'test', provider: 'deepseek-official' } } } },
    { seq: 1, time, type: 'step/start', data: {} },
    { seq: 2, time: time + 2000, type: 'assistant/message', data: { turn: 0, step: 0, usage: { inputTokens: 100, outputTokens: 10 } } },
    { seq: 3, time: time + 3000, type: 'assistant/message', data: { turn: 0, step: 0, usage: { inputTokens: 200, outputTokens: 20 } } },
    { seq: 4, time: time + 4000, type: 'step/start', data: {} },
    { seq: 5, time: time + 5000, type: 'assistant/message', data: { turn: 0, step: 1, usage: { inputTokens: 300, outputTokens: 30 } } },
  ] as unknown as SessionEvent[]
  expect(estimateDays(events, 0, generations)).toMatchObject({
    '2026-09-21': { inputTokens: 200, outputTokens: 20, cny: 0.00056 },
    '2026-09-22': { inputTokens: 300, outputTokens: 30, cny: 0.00084 },
  })
  expect(estimateSession(events, 0, generations)).toMatchObject({ inputTokens: 500, outputTokens: 50 })
})
