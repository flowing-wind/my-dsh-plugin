import { Context } from '@deepseek-ai/cordis'
import { expect, it } from 'vitest'
import type { BrowserAuth } from '../src/browser-auth.ts'
import { HostConnectionService } from '../src/rpc-host.ts'

it('keeps deployment page credentials behind the Host and Origin fence and restores native auth on disposal', async () => {
  const ctx = new Context()
  const fiber = ctx.plugin(pluginCtx => {
    new HostConnectionService(pluginCtx, ['cloud.example'], {
      isAuthenticated: () => false, authenticateApi: () => undefined,
      authenticatedUrl: (value: string) => value + '?native',
    } as unknown as BrowserAuth)
  })
  await fiber.await()
  try {
    const connection = ctx.get('connection') as HostConnectionService
    const remove = connection.registerBrowserAuthentication({
      isAuthenticated: request => new URL(request.url ?? '/', 'http://localhost').searchParams.get('pageToken') === 'page-credential',
      authorizeIndex: () => true,
      authenticatedUrl: value => value,
    })
    const headers = { host: 'cloud.example', origin: 'https://cloud.example' }
    expect(connection.requestRejection({ headers, url: '/api' })).toBe(401)
    expect(connection.requestRejection({ headers, url: '/api?pageToken=page-credential' })).toBeUndefined()
    expect(connection.requestRejection({ headers: { ...headers, origin: 'https://other.example' }, url: '/api?pageToken=page-credential' })).toBe(403)
    expect(connection.authenticatedUrl('https://cloud.example/')).toBe('https://cloud.example/')
    remove()
    expect(connection.requestRejection({ headers, url: '/api?pageToken=page-credential' })).toBe(401)
    expect(connection.authenticatedUrl('https://cloud.example/')).toBe('https://cloud.example/?native')
  } finally { await fiber.dispose() }
})
