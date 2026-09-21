/** Download actions for existing preview tabs and recorded agent deliveries. */
import { zh, en } from './locales.ts'
import { useEffect, useRef, useState } from 'react'
import { Modal, Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Context } from '@deepseek-ai/cordis'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-ui-deliverables/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-files/client'
import { parseFileAddress } from '@deepseek-ai/dsh-util-workspace-path'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { workspaceDownload: keyof typeof zh }
}

function url(sessionId: string, path: string): string {
  return `/api/workspace-download?${new URLSearchParams({ sessionId, path })}`
}

function DownloadMenu({ tab, sessionId, dismiss, t }: PropsRuntime<'sidebar.right.tab.menu.item'> & PropsLocale<'workspaceDownload'>) {
  const file = parseFileAddress(tab.contentId)
  if (file === undefined) return null
  return <a role="menuitem" href={url(file.scope === 'session' ? file.sessionId : sessionId, file.path)} download onClick={dismiss}>{t('download')}</a>
}

function FileDownload({ path, sessionId, t }: PropsRuntime<'sidebar.files.file.action'> & PropsLocale<'workspaceDownload'>) {
  return <a href={url(sessionId, path)} download title={t('download')} aria-label={`${t('download')}: ${path}`} data-file-action><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg></a>
}


type PreparedArchive = { id: string; bytes: number; requiresConfirmation: boolean; skipped: number }
function FolderDownload({ path, sessionId, t }: PropsRuntime<'sidebar.files.directory.action'> & PropsLocale<'workspaceDownload'>) {
  const [busy, setBusy] = useState(false)
  const [prepared, setPrepared] = useState<PreparedArchive | null>(null)
  const active = useRef<PreparedArchive | null>(null)
  const request = useRef<AbortController | null>(null)
  const address = (id: string, action?: string) => '/api/workspace-archive?' + new URLSearchParams({ sessionId, id, ...(action ? { action } : {}) })
  useEffect(() => () => {
    request.current?.abort()
    if (active.current) void fetch(address(active.current.id, 'cancel'), { method: 'POST', keepalive: true }).catch(error => console.error('Archive cancellation failed', error))
  }, [sessionId, path])
  const download = (archive: PreparedArchive) => {
    const anchor = document.createElement('a')
    anchor.href = address(archive.id); anchor.download = ''; document.body.append(anchor); anchor.click(); anchor.remove()
    active.current = null; setPrepared(null)
  }
  const prepare = async () => {
    setBusy(true)
    const abort = new AbortController(); request.current = abort
    try {
      const response = await fetch(address('', 'prepare'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path }), signal: abort.signal })
      if (!response.ok) throw new Error(await response.text())
      const data: unknown = await response.json()
      if (typeof data !== 'object' || data === null || !('id' in data) || typeof data.id !== 'string' || !('bytes' in data) || typeof data.bytes !== 'number' || !('requiresConfirmation' in data) || typeof data.requiresConfirmation !== 'boolean' || !('skipped' in data) || typeof data.skipped !== 'number') throw new Error('Invalid archive response')
      const archive = { id: data.id, bytes: data.bytes, requiresConfirmation: data.requiresConfirmation, skipped: data.skipped }
      active.current = archive
      if (archive.skipped > 0) window.alert(t('skipped', { count: String(archive.skipped) }))
      if (archive.requiresConfirmation) setPrepared(archive); else download(archive)
    } catch (error) { if (!abort.signal.aborted) window.alert(t('archiveError', { message: String(error) })) }
    finally { if (!abort.signal.aborted) setBusy(false) }
  }
  const cancel = async () => {
    if (busy || !prepared) return
    setBusy(true)
    try {
      const response = await fetch(address(prepared.id, 'cancel'), { method: 'POST' })
      if (!response.ok && response.status !== 404) throw new Error(await response.text())
      active.current = null; setPrepared(null)
    } catch (error) { window.alert(t('archiveError', { message: String(error) })) }
    finally { setBusy(false) }
  }
  const confirm = async () => {
    if (!prepared) return
    setBusy(true)
    try {
      const response = await fetch(address(prepared.id, 'confirm'), { method: 'POST' })
      if (!response.ok) throw new Error(await response.text())
      download(prepared)
    } catch (error) { window.alert(t('archiveError', { message: String(error) })) }
    finally { setBusy(false) }
  }
  return <><button type="button" data-file-action disabled={busy} title={t(busy ? 'compressing' : 'folder')} aria-label={t(busy ? 'compressing' : 'folder') + ': ' + path} onClick={() => { void prepare() }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg></button>{prepared && <Modal open title={t('confirmTitle')} description={t('confirmSize', { size: (prepared.bytes / 1000000).toFixed(2) })} closeLabel={t('cancel')} onClose={() => { void cancel() }} footer={<><Button disabled={busy} onClick={() => { void cancel() }}>{t('cancel')}</Button><Button variant="primary" disabled={busy} onClick={() => { void confirm() }}>{t('confirm')}</Button></>} />}</>
}

function DeliveryAction({ path, sessionId, dismiss, t }: PropsRuntime<'deliverables.file.action'> & PropsLocale<'workspaceDownload'>) {
  return <a role="menuitem" href={url(sessionId, path)} download onClick={dismiss}>{t('download')}</a>
}

/** Slot owners and the existing deliverable event projection. */
export const inject = ['slots', 'locale']

/** @param ctx - Browser slot registry and locale service. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('workspaceDownload', { zh, en }))
  ctx.slots.inject('sidebar.files.directory.action', () => ctx.slots.register({ name: 'sidebar.files.directory.action', id: 'workspace-folder-download', locale: 'workspaceDownload' }, FolderDownload))
  ctx.slots.inject('sidebar.files.file.action', () => ctx.slots.register({
    name: 'sidebar.files.file.action', id: 'download', locale: 'workspaceDownload',
  }, FileDownload))
  ctx.slots.inject('sidebar.right.tab.menu.item', () => ctx.slots.register({
    name: 'sidebar.right.tab.menu.item', id: 'workspace-download', locale: 'workspaceDownload',
  }, DownloadMenu))
  ctx.slots.inject('deliverables.file.action', () => ctx.slots.register({
    name: 'deliverables.file.action', id: 'workspace-download', order: 30, locale: 'workspaceDownload',
  }, DeliveryAction))
}
