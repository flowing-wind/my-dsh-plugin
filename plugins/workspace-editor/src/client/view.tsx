/** Lightweight text editor attached to existing file-tree actions. */
import type { Context } from '@deepseek-ai/cordis'
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Modal, Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-files/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-deliverables/client'
import { z } from 'zod'
import css from './view.module.css'

import { zh, en } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { workspaceEditor: keyof typeof zh } }
type Selection = { sessionId: string; path: string }
type Labels = PropsLocale<'workspaceEditor'>
type Controller = { get: () => Selection | null; subscribe: (fn: () => void) => () => void; select: (s: Selection | null) => void }
const fileSchema = z.object({ text: z.string(), version: z.string(), path: z.string() })

function Editor({ selected, close, t }: Labels & { selected: Selection; close: () => void }) {
  const [original, setOriginal] = useState<z.infer<typeof fileSchema>>()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [generation, setGeneration] = useState(0)
  const dirty = original !== undefined && text !== original.text
  useEffect(() => {
    const abort = new AbortController()
    setBusy(true)
    void (async () => {
      try {
        const response = await fetch(`/api/workspace-editor?${new URLSearchParams(selected)}`, { signal: abort.signal })
        if (!response.ok) throw new Error(await response.text())
        const value = fileSchema.parse(await response.json())
        if (!abort.signal.aborted) { setOriginal(value); setText(value.text); setError('') }
      } catch (failure) { if (!abort.signal.aborted) setError(String(failure)) }
      finally { if (!abort.signal.aborted) setBusy(false) }
    })()
    return () => abort.abort()
  }, [selected, generation])
  useEffect(() => {
    if (!dirty) return
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [dirty])
  const save = async () => {
    if (original === undefined) return
    setBusy(true)
    try {
      const response = await fetch(`/api/workspace-editor?${new URLSearchParams({ sessionId: selected.sessionId })}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...selected, text, version: original.version }) })
      if (!response.ok) throw new Error(await response.text())
      const value = fileSchema.parse(await response.json())
      setOriginal(value); setError('')
    } catch (failure) { setError(String(failure)) }
    finally { setBusy(false) }
  }
  const allowDiscard = () => !dirty || window.confirm(t('discard'))
  return <Modal open className={css.dialog!} contentClassName={css.content!} title={t('edit')} closeLabel={t('close')} onClose={() => { if (!busy && allowDiscard()) close() }} footer={<><Button disabled={busy} onClick={() => { if (allowDiscard()) setGeneration(v => v + 1) }}>{t('reload')}</Button><Button variant="primary" disabled={busy || !dirty} onClick={() => { void save() }}>{t('save')}</Button></>}>
    <div className={css.editor}><p className={css.path} title={selected.path}>{selected.path}</p><p role="status">{t(busy ? 'loading' : dirty ? 'dirty' : 'saved')}</p>{error && <p role="alert">{t('error', { message: error })}</p>}<textarea aria-label={selected.path} value={text} onChange={event => setText(event.target.value)} disabled={busy || original === undefined} spellCheck={false} autoCapitalize="off" autoCorrect="off" /></div>
  </Modal>
}
function Action({ path, sessionId, controller, t }: PropsRuntime<'sidebar.files.file.action'> & Labels & { controller: Controller }) { return <button data-file-action title={t('edit')} aria-label={`${t('edit')}: ${path}`} onClick={() => controller.select({ path, sessionId })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m15 4 5 5-11 11H4v-5L15 4Zm-2 2 5 5"/></svg></button> }
function DeliveryAction({ path, sessionId, dismiss, controller, t }: PropsRuntime<'deliverables.file.action'> & Labels & { controller: Controller }) { return <button role="menuitem" onClick={() => { dismiss(); controller.select({ path, sessionId }) }}>{t('edit')}</button> }
function Dialog({ controller, t }: Labels & { controller: Controller }) { const selected = useSyncExternalStore(controller.subscribe, controller.get); return selected === null ? null : <Editor key={`${selected.sessionId}:${selected.path}`} selected={selected} close={() => controller.select(null)} t={t} /> }
/** Optional UI owners are bound through slots. */
export const inject = ['slots', 'locale']
/** @param ctx - Browser composition context. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('workspaceEditor', { zh, en }))
  let selected: Selection | null = null
  const listeners = new Set<() => void>()
  const controller: Controller = { get: () => selected, subscribe: fn => { listeners.add(fn); return () => { listeners.delete(fn) } }, select: value => { selected = value; for (const fn of listeners) fn() } }
  ctx.slots.inject('sidebar.files.file.action', () => ctx.slots.register({ name: 'sidebar.files.file.action', id: 'workspace-editor', locale: 'workspaceEditor', inject: () => ({ controller }) }, Action))
  ctx.slots.inject('deliverables.file.action', () => ctx.slots.register({ name: 'deliverables.file.action', id: 'workspace-editor', order: 20, locale: 'workspaceEditor', inject: () => ({ controller }) }, DeliveryAction))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'workspace-editor', locale: 'workspaceEditor', inject: () => ({ controller }) }, Dialog))
}
