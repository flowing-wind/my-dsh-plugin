import { Context } from '@deepseek-ai/cordis'
import { SessionId } from '@deepseek-ai/dsh-session'
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import NetworkSandbox from '../src/sandbox-plugin.ts'
import type { NetworkProxy } from '../src/proxy-plugin.ts'
import { createTrafficProxy } from '../src/proxy.ts'

describe.skipIf(process.env.DSH_TEST_LINUX_NETWORK !== '1')('Linux network confinement', () => {
  it('routes curl through the metered socket and blocks a direct loopback connection', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-net-'))
    const socketDirectory = join(root, 'proxy')
    await mkdir(socketDirectory)
    const path = join(socketDirectory, 'owner.sock')
    const counts = { incoming: 0, outgoing: 0 }
    const proxy = createTrafficProxy({
      allow: async signal => signal.throwIfAborted(),
      pace: async (_bytes, signal) => signal.throwIfAborted(),
      record: (_owner, direction, bytes) => { counts[direction] += bytes },
    }, { owner: () => SessionId('sandbox-smoke'), allowPrivateAddresses: true, connectTimeoutMs: 1000 })
    const origin = createServer((_request, response) => response.end('proxy-ok'))
    const ctx = new Context()
    // This provider double supplies only the socket operations consumed by NetworkSandbox.
    ctx.provide('networkProxy', { config: { socketDirectory }, socketFor: async () => path } as unknown as NetworkProxy)
    const plugin = await ctx.plugin(NetworkSandbox, { runnerCommand: ['/usr/bin/bwrap'], runnerFailureSignatures: ['bwrap:'], probeTimeoutMs: 5000 })
    try {
      await new Promise<void>(resolve => origin.listen(0, '127.0.0.1', resolve))
      await new Promise<void>(resolve => proxy.server.listen(path, resolve))
      const address = origin.address()
      if (address === null || typeof address === 'string') throw new Error('Origin TCP address missing')
      const url = `http://127.0.0.1:${address.port}/`
      const command = `curl --silent --show-error --fail --noproxy '' '${url}'; if curl --silent --noproxy '*' --connect-timeout 1 '${url}'; then exit 99; fi; printf '\\ndirect-blocked\\n'`
      const wrapped = await ctx.sandbox.confine(['/bin/sh', '-ec', command], { mode: 'workspace-write', workspaceRoot: root, sessionId: SessionId('sandbox-smoke') })
      const result = await promisify(execFile)(wrapped.argv[0]!, wrapped.argv.slice(1), { cwd: root, timeout: 10000 })
      expect(result.stdout).toBe('proxy-ok\ndirect-blocked\n')
      expect(counts.incoming).toBe(Buffer.byteLength('proxy-ok'))
    } finally {
      await plugin.dispose()
      await proxy.close()
      origin.closeAllConnections()
      if (origin.listening) await new Promise<void>(resolve => origin.close(() => resolve()))
      await rm(root, { recursive: true, force: true })
    }
  })
})
