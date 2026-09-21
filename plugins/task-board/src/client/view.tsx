/** Server task scheduling and live conversation navigation. */
import type { Context } from '@deepseek-ai/cordis'
import { useEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { z } from 'zod'
import css from './view.module.css'
import { zh, en } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { taskBoard: keyof typeof zh } }
const snapshot = z.object({ tasks: z.array(z.object({ id: z.string(), title: z.string(), workspaceId: z.string(), prompt: z.string(), nextAt: z.number(), repeatDays: z.number(), enabled: z.boolean(), status: z.enum(['scheduled', 'dispatching', 'submitted', 'error']), sessionId: z.string().nullable(), error: z.string().nullable() })), workspaces: z.array(z.object({ id: z.string(), title: z.string() })), sessions: z.array(z.object({ id: z.string(), running: z.boolean() })) })
type Props = PropsLocale<'taskBoard'> & PropsRuntime<'main'> & { open: (id: string) => void }
function Page({ t, open, useSessions }: Props) {
  const summaries = new Map(Object.entries(useSessions(state => state.byId)))
  const [data, setData] = useState<z.infer<typeof snapshot>>()
  const [error, setError] = useState('')
  const [generation, setGeneration] = useState(0)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState(''), [prompt, setPrompt] = useState(''), [workspaceId, setWorkspaceId] = useState(''), [time, setTime] = useState(''), [repeatDays, setRepeatDays] = useState(0)
  useEffect(() => {
    const abort = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    void (async () => {
      try { const response = await fetch('/api/task-board', { signal: abort.signal }); if (!response.ok) throw Error(await response.text()); const value = snapshot.parse(await response.json()); if (!abort.signal.aborted) { setData(value); timer = setTimeout(() => setGeneration(v => v + 1), 5000) } }
      catch (error) { if (!abort.signal.aborted) setError(String(error)) }
    })()
    return () => { abort.abort(); clearTimeout(timer) }
  }, [generation])
  const action = async (payload: object) => {
    setBusy(true)
    try { const response = await fetch('/api/task-board', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) throw Error(await response.text()); setData(snapshot.parse(await response.json())); setError(''); setGeneration(v => v + 1) }
    catch (error) { setError(String(error)) }
    finally { setBusy(false) }
  }
  return <main className={css.page}><header><h1>{t('title')}</h1><button onClick={() => setGeneration(v => v + 1)}>{t('refresh')}</button></header><p>{t('note')}</p>{error && <p role="alert">{t('failure', { message: error })}</p>}
    <details className={css.create}><summary>{t('create')}</summary><form onSubmit={event => { event.preventDefault(); void action({ action: 'create', title, prompt, workspaceId, nextAt: new Date(`${time}+08:00`).getTime(), repeatDays }) }}>
      <label>{t('name')}<input required value={title} onChange={e => setTitle(e.target.value)} /></label><label>{t('workspace')}<select required value={workspaceId} onChange={e => setWorkspaceId(e.target.value)}><option value="">{t('workspace')}</option>{data?.workspaces.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}</select></label>
      <label>{t('prompt')}<textarea required value={prompt} onChange={e => setPrompt(e.target.value)} /></label><div className={css.row}><label>{t('time')}<input required type="datetime-local" value={time} onChange={e => setTime(e.target.value)} /></label><label>{t('repeat')}<select value={repeatDays} onChange={e => setRepeatDays(Number(e.target.value))}><option value={0}>{t('once')}</option><option value={1}>{t('daily')}</option><option value={7}>{t('weekly')}</option></select></label></div><button disabled={busy} type="submit">{t('submit')}</button>
    </form></details>
    <h2>{t('active')}</h2><div className={css.tasks}>{data?.sessions.filter(s => s.running).map(s => <article key={s.id}><strong>{summaries.get(s.id)?.displayTitle ?? s.id}</strong><span>{t('running')}</span><button onClick={() => open(s.id)}>{t('open')}</button></article>)}</div>
    {!data ? <p>{t('loading')}</p> : data.tasks.length === 0 ? <p>{t('none')}</p> : <div className={css.tasks}>{data.tasks.map(task => <article key={task.id}><strong>{task.title}</strong><small>{data.workspaces.find(w => w.id === task.workspaceId)?.title}</small><p>{task.prompt}</p><time>{new Intl.DateTimeFormat(undefined, { timeZone: 'Asia/Shanghai', dateStyle: 'medium', timeStyle: 'short' }).format(task.nextAt)}</time><span>{t(task.status)} · {t(task.enabled ? 'scheduled' : 'paused')}</span>{task.error && <p role="alert">{task.error}</p>}<div className={css.actions}>{task.sessionId && <button onClick={() => open(task.sessionId!)}>{t('open')}</button>}<button disabled={busy} onClick={() => { void action({ action: task.enabled ? 'pause' : 'resume', id: task.id }) }}>{t(task.enabled ? 'pause' : 'resume')}</button><button disabled={busy} onClick={() => { void action({ action: 'run', id: task.id }) }}>{t('run')}</button><button disabled={busy} onClick={() => { if (window.confirm(t('deleteConfirm'))) void action({ action: 'delete', id: task.id }) }}>{t('remove')}</button></div></article>)}</div>}
  </main>
}
function Icon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg> }
/** Browser services and conversation navigation. */
export const inject = ['slots', 'locale', 'uiWorkspace']
/** @param ctx - Browser composition context. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('taskBoard', { zh, en }))
  const t = ctx.locale.bind('taskBoard')
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'task-board', locale: 'taskBoard', inject: () => ({ open: (id: string) => ctx.uiWorkspace.openSession(id as SessionId) }) }, Page))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'task-board', order: 9, label: () => t('title') }, Icon))
}
