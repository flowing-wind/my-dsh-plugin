import { Context } from '@deepseek-ai/cordis'
import Agents from '@deepseek-ai/dsh-agent'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import type { ConnectionFetchRoute } from '@deepseek-ai/dsh-client-connection'
import { describe, expect, it, vi } from 'vitest'
import { performance } from 'node:perf_hooks'
import { MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import NetworkUsage from '../src/index.ts'
import { trafficSnapshotSchema } from '../src/wire.ts'

describe('traffic spending enforcement', () => {
  it('paces at 2 Mbps and releases a spending pause only after the current confirmation', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-21T12:00:00+08:00'))
    const ctx = new Context()
    const routes = new Map<string, ConnectionFetchRoute>()
    const storage = await ctx.plugin(Storage)
    const agents = await ctx.plugin(Agents)
    ctx.storage.backend.register('memory', new MemoryStorageBackend())
    const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
    ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    // This transport fixture has no persisted conversation owners.
    ctx.provide('sessionPersistence', { list: async () => [] } as unknown as Context['sessionPersistence'])
    // Policy tests invoke the already-authenticated route handler directly.
    ctx.provide('connection', { fetch: { register(route: ConnectionFetchRoute) {
      routes.set(route.path, route)
      return async () => { routes.delete(route.path) }
    } } } as Context['connection'])
    const plugin = await ctx.plugin(NetworkUsage, {
      cnyPerGB: 0.8, windowMs: 600_000, windowCny: 0.5, throttledMbps: 2,
      dailyStepCny: 10, checkpointMs: 30_000, refreshMs: 3000,
    })
    try {
      const meter = ctx.networkUsage
      meter.record('host', 'outgoing', 625_000_001)
      const begin = performance.now()
      await meter.pace(125_000, new AbortController().signal)
      expect(performance.now() - begin).toBeGreaterThanOrEqual(490)
      const pacing = meter.pace(125_000, new AbortController().signal)
      await Promise.resolve()
      const disable = routes.get('/api/network-usage.disable-throttle')!
      expect((await disable.fetch(new Request('http://localhost/api/network-usage.disable-throttle', { method: 'POST' }))).status).toBe(200)
      await pacing
      expect(trafficSnapshotSchema.parse(meter.snapshot())).toMatchObject({ throttled: false, throttleDisabled: true })
      meter.record('host', 'outgoing', 12_500_000_000)
      let released = false
      const waiting = meter.allow(new AbortController().signal).then(() => { released = true })
      await Promise.resolve()
      expect(released).toBe(false)
      expect((await disable.fetch(new Request('http://localhost/api/network-usage.disable-throttle', { method: 'POST' }))).status).toBe(409)
      expect(released).toBe(false)
      const state = trafficSnapshotSchema.parse(meter.snapshot())
      const handler = routes.get('/api/network-usage.confirm')!
      const confirm = (step: number) => handler.fetch(new Request('http://localhost/api/network-usage.confirm', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ day: state.daily.day, step }),
      }))
      expect((await confirm(2)).status).toBe(409)
      expect(released).toBe(false)
      expect((await confirm(1)).status).toBe(200)
      await waiting
      expect(released).toBe(true)
      expect(trafficSnapshotSchema.parse(meter.snapshot()).requiredStep).toBeNull()
    } finally {
      await plugin.dispose()
      await facility.closeAll()
      await agents.dispose()
      await storage.dispose()
      vi.useRealTimers()
    }
  })
})
