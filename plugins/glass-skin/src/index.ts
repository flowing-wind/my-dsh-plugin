/** Authenticated, cacheable default wallpaper for the optional skin. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-connection'
import { readFile } from 'node:fs/promises'
/** Wallpaper transport owner. */
export const inject = ['connection']
/** @param ctx - Authenticated browser connection. */
export function apply(ctx: Context): void {
  for (const name of ['whiteout', 'oregairu']) ctx.connection.fetch.register({ path: `/api/glass-skin/${name}.webp`, methods: ['GET'], requestBody: 'buffered', fetch: async () => new Response(await readFile(new URL(`../assets/${name}.webp`, import.meta.url)), { headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff' } }) })
}
