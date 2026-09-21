import { Context } from '@deepseek-ai/cordis'
import Agents from '@deepseek-ai/dsh-agent'
import { SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import { SandboxPolicyService } from '@deepseek-ai/dsh-sandbox-policy'
import LocalSubprocessRuntime from '@deepseek-ai/dsh-subprocess-local'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import NetworkProxy from '../src/proxy-plugin.ts'
import NetworkSandbox from '../src/sandbox-plugin.ts'
import NetworkBash from '../src/bash-plugin.ts'
import type NetworkUsage from '../src/index.ts'

it.skipIf(process.platform !== 'linux')('authenticates full-access foreground and background downloads and preserves Session ownership', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-proxy-shell-'))
  const ctx = new Context()
  const disposers: (() => Promise<void>)[] = []
  const owners: string[] = []
  // The proxy consumes only meter admission, pacing, and recording operations.
  ctx.provide('networkUsage', {
    allow: async (signal: AbortSignal) => signal.throwIfAborted(),
    pace: async (_bytes: number, signal: AbortSignal) => signal.throwIfAborted(),
    record: (owner: string) => owners.push(owner),
  } as unknown as NetworkUsage)
  const origin = createServer((_request, response) => response.end('download-ok'))
  try {
    for (const [plugin, config] of [[Agents, {}], [SessionProjectionRegistry, {}], [SandboxPolicyService, { mode: 'workspace-write', workspaceRoot: root }], [LocalSubprocessRuntime, {}], [NetworkProxy, { socketDirectory: join(root, 'proxy'), allowPrivateAddresses: true, connectTimeoutMs: 15000 }], [NetworkSandbox, { runnerCommand: ['/usr/bin/bwrap'], runnerFailureSignatures: ['bwrap:'], probeTimeoutMs: 5000 }], [NetworkBash, { timeoutMs: 5000 }]] as const) {
      const fork = await ctx.plugin(plugin, config)
      disposers.unshift(() => fork.dispose())
    }
    await new Promise<void>(resolve => origin.listen(0, '127.0.0.1', resolve))
    const address = origin.address()
    if (!address || typeof address === 'string') throw new Error('Missing origin address')
    const request = { command: `curl --fail --silent --show-error --noproxy '' http://127.0.0.1:${address.port}`, workdir: root,
      sandboxPolicy: { mode: 'danger-full-access' as const, workspaceRoot: root, sessionId: SessionId('download-test') } }
    const spec = ctx.shell.resolve(request)
    expect(spec.env?.HTTP_PROXY).not.toBe(process.env.HTTP_PROXY)
    const unauthenticated = new URL(spec.env!.HTTP_PROXY!)
    unauthenticated.username = ''; unauthenticated.password = ''
    const denied = await ctx.shell.run({ ...spec, command: `curl --silent --fail --noproxy '' --proxy '${unauthenticated}' http://127.0.0.1:${address.port}` })
    expect(denied.exitCode).not.toBe(0)
    const result = await ctx.shell.run(spec)
    expect(result.exitCode).toBe(0)
    expect(result.stdout.text).toBe('download-ok')
    expect(owners.length).toBeGreaterThan(0)
    expect(new Set(owners)).toEqual(new Set(['download-test']))
    const child = await ctx.shell.start(spec)
    await child.done
    expect(owners.length).toBeGreaterThan(1)
    const confined = ctx.shell.resolve({ ...request, sandboxPolicy: { ...request.sandboxPolicy, mode: 'workspace-write' } })
    expect(confined.env?.HTTP_PROXY).toBeUndefined()
    if (process.env.DSH_TEST_PYPI === '1') {
      const download = await ctx.shell.run(ctx.shell.resolve({ ...request,
        command: `uv pip install --dry-run --python '${process.env.VIRTUAL_ENV}/bin/python' --cache-dir '${root}/uv-cache' numpy matplotlib cairosvg`,
        timeoutMs: 60000,
      }))
      expect(download.stderr.text).not.toContain('proxy authorization required')
      expect(download.exitCode, download.stderr.text).toBe(0)
    }
  } finally {
    for (const dispose of disposers) await dispose()
    origin.closeAllConnections()
    if (origin.listening) await new Promise<void>(resolve => origin.close(() => resolve()))
    await rm(root, { recursive: true, force: true })
  }
}, process.env.DSH_TEST_PYPI === '1' ? 90000 : 15000)
