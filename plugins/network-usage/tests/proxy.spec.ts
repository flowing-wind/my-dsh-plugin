import { createServer, request } from 'node:http'
import type { Server } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createTrafficProxy } from '../src/proxy.ts'
import type { TrafficMeter } from '../src/proxy.ts'

const cleanup: (() => Promise<void>)[] = []
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close() })

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('TCP listener missing')
  return address.port
}

describe('metered HTTP proxy', () => {
  it('attributes upload and download payloads to the listener owner', async () => {
    const origin = createServer((incoming, response) => {
      const chunks: Buffer[] = []
      incoming.on('data', chunk => chunks.push(chunk))
      incoming.on('end', () => response.end(Buffer.concat(chunks)))
    })
    const originPort = await listen(origin)
    cleanup.push(() => new Promise<void>((resolve, reject) => origin.close(error => error ? reject(error) : resolve())))
    const counts = { incoming: 0, outgoing: 0 }
    const meter: TrafficMeter = {
      allow: async signal => { signal.throwIfAborted() },
      pace: async (_bytes, signal) => { signal.throwIfAborted() },
      record: (owner, direction, bytes) => { expect(owner).toBe('host'); counts[direction] += bytes },
    }
    const proxy = createTrafficProxy(meter, { owner: () => 'host', allowPrivateAddresses: true, connectTimeoutMs: 1000 })
    cleanup.push(() => proxy.close())
    const proxyPort = await listen(proxy.server)
    const payload = Buffer.alloc(150_000, 'x')
    const body = await new Promise<Buffer>((resolve, reject) => {
      const upload = request({ host: '127.0.0.1', port: proxyPort, method: 'POST', path: `http://127.0.0.1:${originPort}/echo`, headers: { 'content-length': payload.length } }, response => {
        const chunks: Buffer[] = []
        response.on('data', chunk => chunks.push(chunk))
        response.on('error', reject)
        response.on('end', () => resolve(Buffer.concat(chunks)))
      })
      upload.on('error', reject)
      upload.end(payload)
    })
    expect(body).toEqual(payload)
    expect(counts).toEqual({ incoming: payload.length, outgoing: payload.length })
  })
})
