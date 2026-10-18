import type { Context } from '@deepseek-ai/cordis'
import type { ConnectionFetchRoute } from '@deepseek-ai/dsh-client-connection'
import { afterEach, expect, it, vi } from 'vitest'
import { apply } from '../src/index.ts'

afterEach(() => vi.unstubAllGlobals())

function route(key?: string): ConnectionFetchRoute {
  let registered: ConnectionFetchRoute | undefined
  const ctx = {
    credentials: { resolve: async () => key === undefined ? undefined : { value: key } },
    connection: { fetch: { register: (value: ConnectionFetchRoute) => { registered = value } } },
    effect: (effect: () => () => void) => effect(),
  } as unknown as Context
  apply(ctx, { apiKeyEnv: 'DEEPSEEK_API_KEY', balanceUrl: 'https://api.deepseek.com/user/balance', requestTimeoutMs: 15000 })
  if (registered === undefined) throw new Error('Balance route was not registered')
  return registered
}

it('reports a missing API Key without contacting the provider', async () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  const response = await route().fetch(new Request('http://localhost/api/account-balance'))
  expect(response.status).toBe(409)
  expect(fetch).not.toHaveBeenCalled()
})

it('returns validated balance fields while keeping credentials on the Host', async () => {
  const fetch = vi.fn(async () => Response.json({
    is_available: true, balance_infos: [{ currency: 'CNY', total_balance: '12.34', granted_balance: '1.00', topped_up_balance: '11.34', secret: 'private' }],
    key: 'private',
  }))
  vi.stubGlobal('fetch', fetch)
  const response = await route('test-private-key').fetch(new Request('http://localhost/api/account-balance'))
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  const text = await response.text()
  expect(text).toContain('12.34')
  expect(text).not.toContain('private')
  expect(fetch).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ headers: { authorization: 'Bearer test-private-key' }, redirect: 'error' }))
})

it('reports upstream rejection and malformed balances without returning provider bodies', async () => {
  for (const response of [new Response('private provider diagnostic', { status: 401 }), Response.json({ is_available: true })]) {
    vi.stubGlobal('fetch', async () => response)
    const result = await route('test-key').fetch(new Request('http://localhost/api/account-balance'))
    expect(result.status).toBe(502)
    expect(await result.text()).not.toContain('private')
  }
})
