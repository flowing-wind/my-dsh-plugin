/** Meter authenticated browser file transfers without buffering entire files. */
import type { Context } from '@deepseek-ai/cordis'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { TrafficOwner } from './index.ts'

/**
 * Attach byte accounting and outbound pacing to Connection's authenticated body wrapper.
 * @param ctx - Traffic meter and HTTP extension event owner.
 */
export function meterBrowserTransfers(ctx: Context): void {
  ctx.on('connection/fetch', async (exchange, next) => {
    const request = exchange.request
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')
    const owner: TrafficOwner = sessionId === null ? 'host' : SessionId(sessionId)
    const control = url.pathname.startsWith('/api/network-usage') || url.pathname === '/api/usage-billing'
    if (request.body !== null) {
      exchange.request = new Request(request, {
        body: request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, controller) {
            ctx.networkUsage.record(owner, 'incoming', chunk.byteLength)
            controller.enqueue(chunk)
          },
        })), duplex: 'half',
      } as RequestInit & { duplex: 'half' })
    }
    const response = await next()
    if (response.body === null) return response
    const body = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      async transform(chunk, controller) {
        for (let offset = 0; offset < chunk.byteLength; offset += 65_536) {
          const part = chunk.subarray(offset, offset + 65_536)
          if (!control) await ctx.networkUsage.pace(part.byteLength, request.signal)
          ctx.networkUsage.record(owner, 'outgoing', part.byteLength)
          controller.enqueue(part)
        }
      },
    }))
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers })
  })
}
