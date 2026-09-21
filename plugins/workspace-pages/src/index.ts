/** Authenticated static-page bundles and inline document delivery. */
import type { Context } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { readFile, realpath, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep, extname } from 'node:path'
import { SessionId } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type {} from '@deepseek-ai/dsh-client-connection'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { pageShell } from './shell.ts'

/** Bounds for browser-packaged static documents. */
export interface Config { maxAssetBytes: number; maxTotalBytes: number; maxAssets: number }
/** Static-page resource limits. */
export const Config: schema<Config> = schema.object({ maxAssetBytes: schema.natural().min(1).required(), maxTotalBytes: schema.natural().min(1).required(), maxAssets: schema.natural().min(1).required() })
/** Existing authenticated transport and conversation ownership. */
export const inject = ['connection', 'sessionPersistence']
const mime: Record<string, string> = { '.html': 'text/html', '.htm': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.md': 'text/plain', '.woff2': 'font/woff2' }

/** @param ctx - Host services. @param config - Resource limits exposed to the trusted preview shell. */
export function apply(ctx: Context, config: Config): void {
  ctx.inject(['systemPrompt'], promptCtx => {
    promptCtx.systemPrompt.section({ name: 'workspace-pages', order: promptCtx.systemPrompt.getSectionOrder('WEB_SURFACE'), text: () => 'For an interactive explanation or small browser tool, create a static HTML page in the workspace and call present with its path. The user can open it in a new browser tab through the authenticated Harness domain. Use inline or local classic JavaScript, CSS, and images. No server process or public port is needed. The page runs in an isolated frame: remote requests, API access, ES modules, CSS @import, and form navigation are blocked. Keep the page self-contained or use relative local resource paths. Use responsive layout for phone and desktop screens.' })
  })
  ctx.connection.fetch.register({ path: '/api/workspace-pages', methods: ['GET'], requestBody: 'buffered', fetch: async request => {
    try {
      const query = new URL(request.url).searchParams
      const id = query.get('sessionId'), path = query.get('path')
      if (!id || !path) return new Response('Conversation and path are required', { status: 400 })
      const session = await ctx.sessionPersistence.stat(SessionId(id))
      if (!session?.header.cwd) return new Response('Workspace not found', { status: 404 })
      const root = await realpath(session.header.cwd)
      const target = await realpath(resolve(root, path))
      const child = relative(root, target)
      if (!child || child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child)) return new Response('File is outside the workspace', { status: 403 })
      const info = await stat(target)
      if (!info.isFile() || info.size > config.maxAssetBytes) return new Response('Preview file exceeds configured size limit', { status: 413 })
      const type = mime[extname(target).toLowerCase()] ?? 'text/plain'
      if (type === 'text/html' && query.get('asset') !== '1') return new Response(pageShell({ sessionId: id, path: child.split(sep).join('/'), ...config }), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; script-src 'unsafe-inline' data: blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'self'; frame-src blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'", 'referrer-policy': 'no-referrer' } })
      const bytes = await readFile(target)
      return new Response(bytes, { headers: { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'", 'content-disposition': query.get('asset') === '1' ? 'attachment' : 'inline', 'content-length': String(bytes.length) } })
    } catch (error) { return new Response(String(error), { status: 400 }) }
  } })
}
