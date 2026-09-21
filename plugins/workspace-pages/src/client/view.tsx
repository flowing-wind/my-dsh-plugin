/** Download actions for existing preview tabs and recorded agent deliveries. */
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

import { zh, en } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { workspacePages: keyof typeof zh }
}

function url(sessionId: string, path: string): string {
  return `/api/workspace-pages?${new URLSearchParams({ sessionId, path })}`
}

function DownloadMenu({ tab, sessionId, dismiss, t }: PropsRuntime<'sidebar.right.tab.menu.item'> & PropsLocale<'workspacePages'>) {
  const file = parseFileAddress(tab.contentId)
  if (file === undefined) return null
  return <a role="menuitem" href={url(file.scope === 'session' ? file.sessionId : sessionId, file.path)} target="_blank" rel="noopener noreferrer" onClick={dismiss}>{t('download')}</a>
}

function FileDownload({ path, sessionId, t }: PropsRuntime<'sidebar.files.file.action'> & PropsLocale<'workspacePages'>) {
  return <a href={url(sessionId, path)} target="_blank" rel="noopener noreferrer" title={t('download')} aria-label={`${t('download')}: ${path}`} data-file-action><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M14 3h7v7M21 3 10 14M11 5H5v14h14v-6"/></svg></a>
}

function DeliveryAction({ path, sessionId, dismiss, t }: PropsRuntime<'deliverables.file.action'> & PropsLocale<'workspacePages'>) {
  return <a role="menuitem" href={url(sessionId, path)} target="_blank" rel="noopener noreferrer" onClick={dismiss}>{t('download')}</a>
}

/** Slot owners and the existing deliverable event projection. */
export const inject = ['slots', 'locale']

/** @param ctx - Browser slot registry and locale service. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('workspacePages', { zh, en }))
  ctx.slots.inject('sidebar.files.file.action', () => ctx.slots.register({
    name: 'sidebar.files.file.action', id: 'workspace-pages', locale: 'workspacePages',
  }, FileDownload))
  ctx.slots.inject('sidebar.right.tab.menu.item', () => ctx.slots.register({
    name: 'sidebar.right.tab.menu.item', id: 'workspace-pages', locale: 'workspacePages',
  }, DownloadMenu))
  ctx.slots.inject('deliverables.file.action', () => ctx.slots.register({
    name: 'deliverables.file.action', id: 'workspace-pages', order: 10, locale: 'workspacePages',
  }, DeliveryAction))
}
