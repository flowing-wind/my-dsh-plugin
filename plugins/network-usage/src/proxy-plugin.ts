/** Host proxy pools and per-Session Unix listeners for the confined shell bridge. */
import { Context, Service } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { randomUUID } from 'node:crypto'
import { mkdir, rm } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { ProxyAgent } from 'undici'
import { installProxyFromEnvironment } from '@deepseek-ai/dsh-http-proxy'
import type {} from '@deepseek-ai/dsh-agent'
import type { SessionId } from '@deepseek-ai/dsh-session'
import type { TrafficOwner } from './index.ts'
import { createTrafficProxy } from './proxy.ts'

/** Dedicated socket directory and destination validation policy. */
export interface Config {
  socketDirectory: string
  allowPrivateAddresses: boolean
  connectTimeoutMs: number
}

declare module '@deepseek-ai/cordis' {
  interface Context { networkProxy: NetworkProxy }
}

/** Authenticated Host proxy and fixed-identity shell endpoints. */
export class NetworkProxy extends Service {
  static inject = ['networkUsage', 'agents']
  static Config: schema<Config> = schema.object({
    socketDirectory: schema.string().required(), allowPrivateAddresses: schema.boolean().required(),
    connectTimeoutMs: schema.natural().min(1).required(),
  })
  private readonly tokens = new Map<string, TrafficOwner>()
  private readonly pools = new Map<TrafficOwner, ProxyAgent>()
  private readonly listeners = new Map<SessionId, Promise<{ path: string; close(): Promise<void> }>>()
  private url = ''
  private readonly shellUrls = new Map<TrafficOwner, string>()

  /** @param ctx - Traffic meter and initiator attribution. @param config - Socket and proxy policy. */
  constructor(ctx: Context, readonly config: Config) {
    super(ctx, 'networkProxy')
    if (!isAbsolute(config.socketDirectory)) throw new Error('socketDirectory must be absolute')
  }

  protected async [Service.init](): Promise<void> {
    await mkdir(this.config.socketDirectory, { recursive: true, mode: 0o700 })
    const proxy = createTrafficProxy(this.ctx.networkUsage, {
      ...this.config,
      owner: request => {
        const token = request.headers['proxy-authorization']
        return typeof token === 'string' ? this.tokens.get(token) : undefined
      },
    })
    this.ctx.effect(() => () => proxy.close())
    await new Promise<void>((resolve, reject) => {
      proxy.server.once('error', reject)
      proxy.server.listen(0, '127.0.0.1', resolve)
    })
    const address = proxy.server.address()
    if (address === null || typeof address === 'string') throw new Error('Proxy TCP address unavailable')
    this.url = `http://127.0.0.1:${address.port}`
    const restore = await installProxyFromEnvironment({
      get: name => ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY'].includes(name) ? { value: this.url } : undefined,
    }, message => { throw new Error(message) }, (base) => {
      const direct = base.dispatch.bind(base)
      base.dispatch = (options, handler) => {
        const hostname = new URL(String(options.origin)).hostname
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return direct(options, handler)
        const owner = this.ctx.agents.currentInitiator()?.session.id ?? 'host'
        let pool = this.pools.get(owner)
        if (pool === undefined) {
          const token = `Basic ${Buffer.from(`${randomUUID()}:`).toString('base64')}`
          this.tokens.set(token, owner)
          pool = new ProxyAgent({ uri: this.url, token })
          this.pools.set(owner, pool)
        }
        return pool.dispatch(options, handler)
      }
      return base
    })
    this.ctx.effect(() => async () => {
      await proxy.close()
      await Promise.all([...this.pools.values()].map(pool => pool.destroy()))
      await Promise.all([...this.listeners.values()].map(async listener => (await listener).close()))
      await restore()
    })
  }

  /**
   * Obtain a Session-owned Unix proxy socket for a network-isolated shell.
   * @param sessionId - Session whose traffic this socket records.
   * @returns Absolute Unix socket path, inaccessible to other Sessions' sandbox mounts.
   */
  socketFor(sessionId: SessionId): Promise<string> {
    let listener = this.listeners.get(sessionId)
    if (listener === undefined) {
      listener = this.createSocket(sessionId)
      this.listeners.set(sessionId, listener)
      void listener.catch(() => this.listeners.delete(sessionId))
    }
    return listener.then(value => value.path)
  }

  /**
   * Issue proxy credentials attributed to one full-access shell owner.
   * @param owner - Calling Session, or Host for calls outside a Session.
   * @returns Authenticated proxy URL for child-process environment variables; never log it.
   */
  shellUrl(owner: TrafficOwner): string {
    const existing = this.shellUrls.get(owner)
    if (existing !== undefined) return existing
    const username = randomUUID()
    const password = randomUUID()
    this.tokens.set(`Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`, owner)
    const url = new URL(this.url)
    url.username = username
    url.password = password
    const value = url.href
    this.shellUrls.set(owner, value)
    return value
  }
  private async createSocket(sessionId: SessionId): Promise<{ path: string; close(): Promise<void> }> {
    const path = join(this.config.socketDirectory, `${randomUUID()}.sock`)
    const proxy = createTrafficProxy(this.ctx.networkUsage, { ...this.config, owner: () => sessionId })
    try {
      await new Promise<void>((resolve, reject) => {
        proxy.server.once('error', reject)
        proxy.server.listen(path, resolve)
      })
    } catch (error) {
      await proxy.close()
      throw error
    }
    return { path, close: async () => { await proxy.close(); await rm(path, { force: true }) } }
  }
}

export default NetworkProxy
