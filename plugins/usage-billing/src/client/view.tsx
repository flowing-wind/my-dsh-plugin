/** Localized usage cards, retained Session rows, and composer estimate. */
import { Fragment, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { billingSnapshotSchema } from '../wire.ts'
import type { BillingSnapshot } from '../wire.ts'
import css from './view.module.css'

function useBilling(): { data: BillingSnapshot | undefined; failed: boolean; reload: () => void } {
  const [data, setData] = useState<BillingSnapshot>()
  const [failed, setFailed] = useState(false)
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    const abort = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    void (async () => {
      try {
        const response = await fetch('/api/usage-billing', { signal: abort.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const value = billingSnapshotSchema.parse(await response.json())
        if (!abort.signal.aborted) {
          setData(value)
          setFailed(false)
          timer = setTimeout(() => setGeneration(previous => previous + 1), value.refreshMs)
        }
      } catch (error) {
        if (!abort.signal.aborted) setFailed(true)
      }
    })()
    return () => { abort.abort(); clearTimeout(timer) }
  }, [generation])
  return { data, failed, reload: () => setGeneration(value => value + 1) }
}

/** @param props - Root Session metadata and localized labels. @returns Usage dashboard. */
export function BillingPage({ t, useSessions, useWorkspaces }: PropsRuntime<'usage-dashboard.section'> & PropsLocale<'usageBilling'>): ReactNode {
  const { data, failed, reload } = useBilling()
  const sessions = new Map(Object.entries(useSessions(state => state.byId)))
  const workspaces = useWorkspaces(state => state.items)
  const archived = new Set<string>(useWorkspaces(state => state.archivedSessionIds))
  const entries = Object.entries(data?.sessions ?? {}).filter(([id, value]) => {
    const summary = sessions.get(id)
    return id !== 'host' && (summary?.blank !== true || summary.title !== undefined || archived.has(id) || value.inputTokens + value.cacheReadTokens + value.cacheWriteTokens + value.outputTokens > 0)
  })
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const toggleGroup = (key: string) => setCollapsed(previous => { const next = new Set(previous); if(next.has(key)) next.delete(key); else next.add(key); return next })
  const grouped = new Map<string, { title: string; rows: typeof entries }>()
  for (const row of entries) {
    const [id] = row
    const session = sessions.get(id)
    const workspace = workspaces.find(item => item.sessionIds.some(member => member === id))
      ?? workspaces.find(item => session?.cwd !== undefined && item.path === session.cwd)
    const key = workspace?.workspaceId ?? ''
    if (!grouped.has(key)) grouped.set(key, { title: workspace?.title ?? t('ungrouped'), rows: [] })
    grouped.get(key)!.rows.push(row)
  }
  const label = (id: string) => sessions.get(id)?.title ?? t('unnamed')
  const count = (value: number) => new Intl.NumberFormat().format(value)
  const totals = data?.totals
  const input = totals === undefined ? 0 : totals.inputTokens + totals.cacheReadTokens + totals.cacheWriteTokens
  const cny = data?.balance?.value.balance_infos.find(item => item.currency === 'CNY')
  const tokens = (value: NonNullable<BillingSnapshot['daily']>) => value.inputTokens + value.cacheReadTokens + value.cacheWriteTokens + value.outputTokens
  return <section className={css.page}>
    <header className={css.heading}><div><h2>{t('title')}</h2></div><button onClick={reload}>{t('refresh')}</button></header>
    {data === undefined ? <p role="status">{t(failed ? 'error' : 'loading')}</p> : <>
      <div className={css.cards}>
        <article><span>{t('todayTokens')}</span><strong>{count(tokens(data.daily))}</strong><small>{t('todayCost', { cost: data.daily.cny.toFixed(4) })}</small><small>{data.day}</small></article>
        <article className={css.balance}><span>{t('balance')}</span><strong>{cny === undefined ? '—' : `¥${Number(cny.total_balance).toFixed(2)}`}</strong><small>{t(data.period)}</small>{data.balanceError && <small>{t('unavailable')}</small>}</article>
        <article><span>{t('tokens')}</span><strong>{count(tokens(data.totals))}</strong><small>{t('lifetimeCost', { cost: data.totals.cny.toFixed(4) })}</small><small>{t('hit')} {input === 0 ? '—' : `${(data.totals.cacheReadTokens / input * 100).toFixed(1)}%`}</small></article>
      </div>
      <p className={css.notice}>{t('notice')}</p>
      {data.totals.unpricedRequests > 0 && <p role="status">{t('unpriced', { count: data.totals.unpricedRequests })}</p>}
      <details className={css.details}><summary>{t('details', { count: entries.length })}</summary><div className={css.table}><table><thead><tr><th>{t('session')}</th><th>{t('input')}</th><th>{t('output')}</th><th>{t('cost')}</th></tr></thead><tbody>
        {[...grouped].map(([key, group]) => <Fragment key={key}>
          <tr className={css.workspace} data-workspace-summary onClick={() => toggleGroup(key)}><td><button type="button" aria-expanded={!collapsed.has(key)} onClick={event => { event.stopPropagation(); toggleGroup(key) }}><span aria-hidden>{collapsed.has(key) ? "▸" : "▾"}</span> {group.title}</button><small>{t('subtotal')}</small></td><td data-label={t('input')}>{count(group.rows.reduce((sum, [, v]) => sum + v.inputTokens + v.cacheReadTokens + v.cacheWriteTokens, 0))}</td><td data-label={t('output')}>{count(group.rows.reduce((sum, [, v]) => sum + v.outputTokens, 0))}</td><td data-label={t('cost')}>¥{group.rows.reduce((sum, [, v]) => sum + v.cny, 0).toFixed(4)}</td></tr>
          {!collapsed.has(key) && group.rows.sort((a, b) => b[1].updatedAt - a[1].updatedAt).map(([id, value]) => <tr key={id}>
            <td><span>{label(id)}</span>{archived.has(id) && <small>{t('archived')}</small>}<small>{id}</small></td><td data-label={t('input')}>{count(value.inputTokens + value.cacheReadTokens + value.cacheWriteTokens)}</td><td data-label={t('output')}>{count(value.outputTokens)}</td><td data-label={t('cost')}>¥{value.cny.toFixed(4)}</td>
          </tr>)}
        </Fragment>)}
      </tbody></table>{entries.length === 0 && <p>{t('empty')}</p>}</div></details>
    </>}
  </section>
}

/** @param props - Bound Session and localized labels. @returns Per-Session cost and current tariff. */
export function BillingBadge({ t, sessionId }: PropsRuntime<'conversation.composer.dock'> & PropsLocale<'usageBilling'>): ReactNode {
  const { data, reload } = useBilling()
  if (data === undefined) return null
  const cost = data.sessions[sessionId]?.cny ?? 0
  return <button className={css.badge} onClick={reload} title={t('refresh')}>{t('current', { cost: cost.toFixed(4) })}<span>·</span>{t(data.period)}</button>
}
