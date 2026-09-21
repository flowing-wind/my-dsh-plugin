import { Context } from '@deepseek-ai/cordis'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import JsonlSessionPersistence from '../src/index.ts'
import { meta } from '../../session-persistence/tests/contract.ts'

describe('permanent Session deletion', () => {
  it('refuses active writers and removes a closed Session without removing its neighbor', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-delete-'))
    const ctx = new Context()
    const other = new Context()
    const first = await ctx.plugin(JsonlSessionPersistence, { root, compression: 'none' })
    const second = await other.plugin(JsonlSessionPersistence, { root, compression: 'none' })
    try {
      const selected = meta('selected', root)
      const neighbor = meta('neighbor', root)
      const writer = await ctx.sessionPersistence.create(selected)
      try {
        await writer.flush()
        await expect(ctx.sessionPersistence.delete(selected.id)).rejects.toThrow()
        await expect(other.sessionPersistence.delete(selected.id)).rejects.toThrow()
      } finally { await writer.close() }
      const retained = await ctx.sessionPersistence.create(neighbor)
      await retained.flush()
      await retained.close()
      expect(await ctx.sessionPersistence.delete(selected.id)).toBe(true)
      expect(await ctx.sessionPersistence.stat(selected.id)).toBeUndefined()
      expect(await ctx.sessionPersistence.stat(neighbor.id)).toBeDefined()
      expect(await ctx.sessionPersistence.delete(selected.id)).toBe(false)
    } finally {
      await second.dispose()
      await first.dispose()
      await rm(root, { recursive: true, force: true })
    }
  })
})
