/** Deletion controls in existing menus, archives, and Workspace confirmations. */
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-unarchive-sessions/client'
import { z } from 'zod'
import { en, zh } from './locales.ts'
import css from './actions.module.css'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { workspaceManagement: keyof typeof zh }
}
type Labels = PropsLocale<'workspaceManagement'>
type Selection = { kind: 'session' | 'workspace'; id: string; title: string }
interface Controller {
  get: () => Selection | null
  subscribe: (listener: () => void) => () => void
  select: (selection: Selection | null) => void
}
const workspacesSchema = z.object({ workspaces: z.array(z.object({ id: z.string(), canDeleteFiles: z.boolean() })) })

function Confirmation({ selected, close, t }: Labels & { selected: Selection; close: () => void }) {
  const [files, setFiles] = useState(false)
  const [sessions, setSessions] = useState(false)
  const [canDeleteFiles, setCanDeleteFiles] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (selected.kind !== 'workspace') return
    const abort = new AbortController()
    void (async () => {
      try {
        const response = await fetch('/api/workspace-management', { signal: abort.signal })
        if (!response.ok) throw new Error(await response.text())
        const value = workspacesSchema.parse(await response.json())
        if (!abort.signal.aborted) setCanDeleteFiles(value.workspaces.find(row => row.id === selected.id)?.canDeleteFiles === true)
      } catch (failure) { if (!abort.signal.aborted) setError(String(failure)) }
    })()
    return () => { abort.abort() }
  }, [selected.kind, selected.id])
  const remove = async () => {
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/workspace-management.delete', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: selected.kind, id: selected.id, confirmed: true, deleteFiles: files, deleteSessions: sessions }),
      })
      if (!response.ok) throw new Error(await response.text())
      close()
    } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)); setPending(false) }
  }
  return <Modal open onClose={() => { if (!pending) close() }} closeLabel={t('cancel')} title={t('confirmation')} description={selected.title}
    footer={<><Button variant="outline" disabled={pending} onClick={close}>{t('cancel')}</Button><Button variant="primary" disabled={pending} onClick={() => { void remove() }}>{t(pending ? 'pending' : 'confirm')}</Button></>}>
    {selected.kind === 'workspace' ? <div className={css.options}><p>{t('retain')}</p>
      <label><input type="checkbox" checked={sessions} disabled={pending} onChange={event => setSessions(event.target.checked)} />{t('allSessions')}</label>
      <label><input type="checkbox" checked={files} disabled={pending || !canDeleteFiles} onChange={event => setFiles(event.target.checked)} />{t('files')}</label>
      <small>{t(canDeleteFiles ? 'filesNote' : 'filesUnavailable')}</small>
    </div> : <p>{t('sessionNote')}</p>}
    {error && <p role="alert">{t('error', { message: error })}</p>}
  </Modal>
}

function SessionAction({ targetSessionId, title, dismiss, controller, t }: Labels & { targetSessionId: string; title: string; dismiss?: () => void; controller: Controller }) {
  return <button className={css.action} role={dismiss === undefined ? undefined : 'menuitem'} onClick={() => {
    controller.select({ kind: 'session', id: targetSessionId, title }); dismiss?.()
  }}>{t('deleteSession')}</button>
}
function SessionDialog({ controller, t }: Labels & { controller: Controller }) {
  const selected = useSyncExternalStore(controller.subscribe, controller.get)
  return selected === null ? null : <Confirmation key={selected.id} selected={selected} close={() => controller.select(null)} t={t} />
}
function WorkspaceDialog({ workspaceId, title, close, t }: PropsRuntime<'sidebar.workspaces.delete'> & Labels) {
  return <Confirmation key={workspaceId} selected={{ kind: 'workspace', id: workspaceId, title }} close={close} t={t} />
}

/** Browser extension services. */
export const inject = ['slots', 'locale']

/** @param ctx - Existing menu, archive, and layout slot services. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('workspaceManagement', { zh, en }))
  let selection: Selection | null = null
  const listeners = new Set<() => void>()
  const controller: Controller = {
    get: () => selection,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
    select: value => { selection = value; for (const listener of listeners) listener() },
  }
  ctx.slots.inject('sidebar.workspaces.session.menu', () => ctx.slots.register({
    name: 'sidebar.workspaces.session.menu', id: 'delete-session', locale: 'workspaceManagement', inject: () => ({ controller }),
  }, SessionAction))
  ctx.slots.inject('settings.archivedSessions.action', () => ctx.slots.register({
    name: 'settings.archivedSessions.action', id: 'delete-session', locale: 'workspaceManagement', inject: () => ({ controller }),
  }, SessionAction))
  ctx.slots.inject('sidebar.workspaces.delete', () => ctx.slots.register({ name: 'sidebar.workspaces.delete', locale: 'workspaceManagement' }, WorkspaceDialog))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'delete-session', locale: 'workspaceManagement', inject: () => ({ controller }) }, SessionDialog))
}
