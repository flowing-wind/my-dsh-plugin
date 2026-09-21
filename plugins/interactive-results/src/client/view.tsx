/** Local table search, chart rendering, and explicit form submission. */
import type { Context } from '@deepseek-ai/cordis'
import { useEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-deliverables/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { z } from 'zod'
import { resultSchema } from '../wire.ts'
import css from './view.module.css'
import { zh, en } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { interactiveResults: keyof typeof zh } }
type Labels = PropsLocale<'interactiveResults'>
function Result({ sessionId, path, t }: Labels & { sessionId: string; path: string }) {
  const [data, setData] = useState<z.infer<typeof resultSchema>>()
  const [error, setError] = useState(''), [query, setQuery] = useState(''), [status, setStatus] = useState<{ index: number; phase: 'sent' | 'sending' }>()
  useEffect(() => { const abort = new AbortController(); void (async () => { try { const response = await fetch(`/api/interactive-results?${new URLSearchParams({ sessionId, path })}`, { signal: abort.signal }); if (!response.ok) throw Error(await response.text()); const value = resultSchema.parse(await response.json()); if (!abort.signal.aborted) setData(value) } catch (error) { if (!abort.signal.aborted) setError(String(error)) } })(); return () => abort.abort() }, [sessionId, path])
  const submit = async (form: HTMLFormElement, index: number) => {
    setStatus({ index, phase: 'sending' })
    try {
      const fields = Object.fromEntries(new FormData(form).entries())
      const requestId = crypto.randomUUID()
      const response = await fetch(`/api/session/prompt?${new URLSearchParams({ sessionId })}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'client-request', rpcId: requestId, method: 'session/prompt', payload: { args: { request: {
          sessionId, requestId, mode: 'queue', content: [{ type: 'text', text: `${data?.title}\n${JSON.stringify(fields, null, 2)}` }],
        } } } }),
      })
      if (!response.ok) throw Error(await response.text())
      const receipt = z.object({ result: z.object({ ok: z.boolean(), error: z.unknown().optional() }) }).parse(await response.json()).result
      if (!receipt.ok) throw Error(JSON.stringify(receipt.error))
      setStatus({ index, phase: 'sent' }); setError('')
    } catch (error) { setError(String(error)); setStatus(undefined) }
  }
  const maxima = data?.blocks.map(block => block.type === 'bar' ? block.entries.reduce((max, entry) => Math.max(max, entry.value), 1) : 1) ?? []
  return <section className={css.result} aria-label={t('title')}><h3>{data?.title ?? t('loading')}</h3>{error && <p role="alert">{t('failed', { message: error })}</p>}{data && <><p>{t('local')}</p>{data.blocks.map((block, index) => <div key={index} className={css.block}>{block.type === 'table' ? <><input aria-label={t('search')} placeholder={t('search')} value={query} onChange={e => setQuery(e.target.value)} /><div className={css.table}><table><thead><tr>{block.columns.map((column, i) => <th key={i}>{column}</th>)}</tr></thead><tbody>{block.rows.filter(row => row.some(value => value.toLowerCase().includes(query.toLowerCase()))).map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody></table></div></> : block.type === 'bar' ? <div>{block.entries.map((entry, i) => <div className={css.bar} key={i}><span>{entry.label}</span><div><i style={{ width: `${entry.value / maxima[index]! * 100}%` }} /></div><strong>{entry.value.toLocaleString()}</strong></div>)}</div> : <form onSubmit={event => { event.preventDefault(); void submit(event.currentTarget, index) }}>{block.fields.map(field => <label key={field.name}>{field.label}{field.type === 'select' ? <select name={field.name}>{field.options?.map(option => <option key={option}>{option}</option>)}</select> : <input name={field.name} type={field.type} required />}</label>)}<button disabled={status?.phase === 'sending'} type="submit">{t(status?.index === index && status.phase === 'sending' ? 'sending' : 'send')}</button>{status?.index === index && status.phase === 'sent' && <p role="status">{t('sent')}</p>}</form>}</div>)}</>}</section>
}
function Deliveries(props: PropsRuntime<'conversation.chat.turnTail'> & Labels) {
  const files = props.turn.data.get('deliverables')?.presented?.filter(file => file.seq < props.seq && file.path.endsWith('.interactive.json')) ?? []
  return <>{[...new Map(files.map(file => [file.path, file])).values()].map(file => <Result key={file.path} sessionId={props.sessionId} path={file.path} t={props.t} />)}</>
}
/** Existing delivery and conversation owners. */
export const inject = ['slots', 'locale']
/** @param ctx - Browser context. */
export function apply(ctx: Context): void { ctx.effect(() => ctx.locale.register('interactiveResults', { zh, en })); ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({ name: 'conversation.chat.turnTail', id: 'interactive-results', locale: 'interactiveResults' }, Deliveries)) }
