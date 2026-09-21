/** Session-attributed HTTP CONNECT proxy with public-address pinning and metered streams. */
import { createServer, request as httpRequest } from 'node:http'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { lookup } from 'node:dns/promises'
import { connect } from 'node:net'
import type { Socket } from 'node:net'
import { Transform } from 'node:stream'
import type { TransformCallback } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import ipaddr from 'ipaddr.js'
import type { NetworkUsage, TrafficOwner } from './index.ts'

/** Transfer accounting operations consumed by proxy streams. */
export type TrafficMeter = Pick<NetworkUsage, 'allow' | 'pace' | 'record'>

/** One listener belongs to one configured authentication or fixed Session resolver. */
export interface ProxyOptions {
  owner(request: IncomingMessage): TrafficOwner | undefined
  allowPrivateAddresses: boolean
  connectTimeoutMs: number
}

class MeteredStream extends Transform {
  constructor(
    private readonly meter: TrafficMeter, private readonly owner: TrafficOwner,
    private readonly direction: 'incoming' | 'outgoing', private readonly signal: AbortSignal,
  ) { super() }

  override _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    void (async () => {
      for (let offset = 0; offset < chunk.length; offset += 65_536) {
        const part = chunk.subarray(offset, offset + 65_536)
        if (this.direction === 'outgoing') await this.meter.pace(part.length, this.signal)
        else await this.meter.allow(this.signal)
        this.signal.throwIfAborted()
        this.meter.record(this.owner, this.direction, part.length)
        this.push(part)
      }
    })().then(() => callback(), (error: Error) => callback(error))
  }
}

/**
 * Create an unbound proxy; its caller owns listening and quiescent shutdown.
 * @param meter - Shared spending meter.
 * @param options - Identity, address policy, and connection timeout.
 * @returns Server plus an asynchronous close operation that cancels every transfer.
 */
export function createTrafficProxy(meter: TrafficMeter, options: ProxyOptions): {
  server: Server; close(): Promise<void>
} {
  const sockets = new Set<Socket>()
  const pending = new Set<Promise<void>>()
  const lifetime = new AbortController()
  const server = createServer((request, response) => {
    run(handleHttp(request, response))
  })
  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
  })
  server.on('connect', (request, client, head) => {
    const socket = client as Socket
    run(handleConnect(request, socket, head))
  })
  const run = (task: Promise<void>): void => {
    pending.add(task)
    void task.finally(() => pending.delete(task))
  }
  async function destination(hostname: string): Promise<string> {
    const host = hostname.replace(/^\[|\]$/g, '')
    const addresses = await lookup(host, { all: true })
    if (addresses.length === 0 || !options.allowPrivateAddresses
      && addresses.some(address => ipaddr.process(address.address).range() !== 'unicast')) {
      throw new Error('Proxy destination must resolve exclusively to public addresses')
    }
    return addresses[0]!.address
  }
  async function handleConnect(request: IncomingMessage, client: Socket, head: Buffer): Promise<void> {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, lifetime.signal])
    client.once('close', () => controller.abort())
    let upstream: Socket | undefined
    try {
      const owner = options.owner(request)
      if (owner === undefined) { client.end('HTTP/1.1 407 Proxy Authentication Required\r\n\r\n'); return }
      await meter.allow(signal)
      const target = new URL(`http://${request.url}`)
      if (target.username || target.password || target.pathname !== '/') throw new Error('Invalid CONNECT authority')
      const address = await destination(target.hostname)
      signal.throwIfAborted()
      upstream = connect({ host: address, port: Number(target.port || 443), signal })
      const remote = upstream
      sockets.add(remote)
      remote.once('close', () => sockets.delete(remote))
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => remote.destroy(new Error('Proxy connect timed out')), options.connectTimeoutMs)
        remote.once('connect', () => { clearTimeout(timer); resolve() })
        remote.once('error', error => { clearTimeout(timer); reject(error) })
      })
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      if (head.length > 0) {
        await meter.pace(head.length, signal)
        meter.record(owner, 'outgoing', head.length)
        remote.write(head)
      }
      await Promise.all([
        pipeline(client, new MeteredStream(meter, owner, 'outgoing', signal), remote, { signal }),
        pipeline(remote, new MeteredStream(meter, owner, 'incoming', signal), client, { signal }),
      ])
    } catch (error) {
      // Socket and policy failures terminate this tunnel without exposing destination details.
      client.destroy()
    } finally {
      controller.abort()
      upstream?.destroy()
    }
  }
  async function handleHttp(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, lifetime.signal])
    response.once('close', () => controller.abort())
    try {
      const owner = options.owner(request)
      if (owner === undefined) { response.writeHead(407).end(); return }
      await meter.allow(signal)
      const target = new URL(request.url!)
      if (target.protocol !== 'http:' || target.username || target.password) throw new Error('Only HTTP or CONNECT is accepted')
      const address = await destination(target.hostname)
      signal.throwIfAborted()
      const { 'proxy-authorization': _auth, 'proxy-connection': _connection, ...headers } = request.headers
      const upstream = httpRequest({
        host: address, port: target.port || 80, path: `${target.pathname}${target.search}`,
        method: request.method, headers: { ...headers, host: target.host }, signal,
      })
      upstream.on('socket', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)) })
      const received = new Promise<IncomingMessage>((resolve, reject) => {
        upstream.once('response', resolve)
        upstream.once('error', reject)
      })
      const upload = pipeline(request, new MeteredStream(meter, owner, 'outgoing', signal), upstream, { signal })
      const download = (async () => {
        const result = await received
        response.writeHead(result.statusCode!, result.headers)
        await pipeline(result, new MeteredStream(meter, owner, 'incoming', signal), response, { signal })
      })()
      await Promise.all([upload, download])
    } catch (error) {
      if (!response.headersSent) response.writeHead(502).end()
      else response.destroy()
    } finally { controller.abort() }
  }
  return {
    server,
    async close(): Promise<void> {
      lifetime.abort()
      for (const socket of sockets) socket.destroy()
      await Promise.allSettled(pending)
      if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    },
  }
}
