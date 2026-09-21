/** Transfer totals and explicit daily spending consent. */
import { Fragment, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { trafficSnapshotSchema } from '../wire.ts'
import type { TrafficSnapshot } from '../wire.ts'
import css from './view.module.css'

function useTraffic() {
  const [data, setData] = useState<TrafficSnapshot>()
  const [error, setError] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [pending, setPending] = useState(false)
  const reload = () => setGeneration(value => value + 1)
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    void (async () => {
      try {
        const response = await fetch('/api/network-usage', { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const value = trafficSnapshotSchema.parse(await response.json())
        if (controller.signal.aborted) return
        setData(value)
        setError(false)
        timer = setTimeout(reload, value.policy.refreshMs)
      } catch (failure) { if (!controller.signal.aborted) setError(true) }
    })()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [generation])
  const confirm = async () => {
    if (data?.requiredStep === null || data === undefined || pending) return
    setPending(true)
    try {
      const response = await fetch('/api/network-usage.confirm', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ day: data.daily.day, step: data.requiredStep }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setData(trafficSnapshotSchema.parse(await response.json()))
      setError(false)
    } catch (failure) { setError(true) }
    finally { setPending(false); reload() }
  }
  const disableThrottle = async () => {
    if (!data?.throttled || pending) return
    setPending(true)
    try {
      const response = await fetch('/api/network-usage.disable-throttle', { method: 'POST' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setData(trafficSnapshotSchema.parse(await response.json()))
      setError(false)
    } catch (failure) { setError(true) }
    finally { setPending(false); reload() }
  }
  return { data, error, pending, reload, confirm, disableThrottle }
}

/** @param props - Localized labels. @returns Global confirmation banner while transfers are paused. */
export function TrafficNotice({ t }: PropsLocale<'networkUsage'>): ReactNode {
  const { data, pending, error, confirm } = useTraffic()
  if (data === undefined || data.requiredStep === null && !data.storageError) return null
  return <aside className={css.warning} role="alert">
    <strong>{data.storageError ? t('storageError') : t('warning', { cost: data.dailyCny.toFixed(2), threshold: data.requiredStep! * data.policy.dailyStepCny })}</strong>
    <p>{t('paused')}</p>
    {error && <p>{t('stale')}</p>}
    {!data.storageError && <button disabled={pending} onClick={() => { void confirm() }}>{t(pending ? 'pending' : 'confirm')}</button>}
  </aside>
}

/** @param props - Localized labels. @returns Historical traffic dashboard. */
export function NetworkPage({ t, useSessions, useWorkspaces }: PropsLocale<'networkUsage'> & PropsRuntime<'usage-dashboard.section'>): ReactNode {
  const { data, error, pending, reload, disableThrottle } = useTraffic()
  const bytes = (value: number) => value >= 1e9 ? `${(value / 1e9).toFixed(2)} GB` : `${(value / 1e6).toFixed(2)} MB`
  const sessions = new Map(Object.entries(useSessions(state => state.byId)))
  const workspaces = useWorkspaces(state => state.items)
  const archived = new Set<string>(useWorkspaces(state => state.archivedSessionIds))
  const entries = Object.entries(data?.sessions ?? {}).filter(([id, value]) => {
    const summary = sessions.get(id)
    return id !== 'host' && (summary?.blank !== true || summary.title !== undefined || archived.has(id) || value.incomingBytes + value.outgoingBytes > 0)
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
  const rows = entries
  const threshold = data === undefined ? 0 : (data.requiredStep ?? data.daily.acknowledgedSteps + 1) * data.policy.dailyStepCny
  return <section className={css.page}>
    <header><div><h2>{t('title')}</h2></div><button onClick={reload}>{t('refresh')}</button></header>
    {data === undefined ? <p role="status">{t(error ? 'error' : 'loading')}</p> : <>
      {error && <p role="alert">{t('stale')}</p>}
      <div className={css.status}><span>{data.throttled ? t('throttled', { rate: data.policy.throttledMbps }) : t(data.throttleDisabled ? 'disabled' : 'normal')}</span><span>{t('window', { cost: data.windowCny.toFixed(4) })}</span>{data.throttled && <button disabled={pending} onClick={() => { void disableThrottle() }}>{t('disableThrottle')}</button>}</div>
      {data.throttleDisabled && <p className={css.note}>{t('resumePolicy', { cost: data.policy.windowCny })}</p>}
      <div className={css.cards}>
        <article><span>{t('todayUsage')}</span><strong>{bytes(data.daily.outgoingBytes)}</strong><small>{t('todayCost', { cost: data.dailyCny.toFixed(4) })}</small><small>{data.daily.day}</small></article>
        <article><span>{t('remaining')}</span><strong>¥{Math.max(0, threshold - data.dailyCny).toFixed(4)}</strong><small>{t('nextThreshold', { cost: threshold })}</small><small>{t(data.requiredStep === null ? 'reset' : 'needsConfirm')}</small></article>
        <article><span>{t('lifetimeUsage')}</span><strong>{bytes(data.totals.outgoingBytes)}</strong><small>{t('lifetimeCost', { cost: data.totals.cny.toFixed(4) })}</small><small>{t('incoming')} {bytes(data.totals.incomingBytes)}</small></article>
      </div>
      <p className={css.note}>{t('note', { price: data.policy.cnyPerGB })}</p>
      <details className={css.details}><summary>{t('details', { count: rows.length })}</summary><div className={css.table}><table><thead><tr><th>{t('session')}</th><th>{t('incoming')}</th><th>{t('outgoing')}</th><th>{t('cost')}</th></tr></thead><tbody>{[...grouped].map(([key, group]) => <Fragment key={key}><tr className={css.workspace} data-workspace-summary onClick={() => toggleGroup(key)}><td><button type="button" aria-expanded={!collapsed.has(key)} onClick={event => { event.stopPropagation(); toggleGroup(key) }}><span aria-hidden>{collapsed.has(key) ? "▸" : "▾"}</span> {group.title}</button><small>{t('subtotal')}</small></td><td data-label={t('incoming')}>{bytes(group.rows.reduce((sum, [, v]) => sum + v.incomingBytes, 0))}</td><td data-label={t('outgoing')}>{bytes(group.rows.reduce((sum, [, v]) => sum + v.outgoingBytes, 0))}</td><td data-label={t('cost')}>¥{group.rows.reduce((sum, [, v]) => sum + v.cny, 0).toFixed(4)}</td></tr>{!collapsed.has(key) && group.rows.map(([id, value]) => <tr key={id}><td>{label(id)}{archived.has(id) && <small>{t('archived')}</small>}</td><td data-label={t('incoming')}>{bytes(value.incomingBytes)}</td><td data-label={t('outgoing')}>{bytes(value.outgoingBytes)}</td><td data-label={t('cost')}>¥{value.cny.toFixed(4)}</td></tr>)}</Fragment>)}</tbody></table>{rows.length === 0 && <p>{t('empty')}</p>}</div></details>
    </>}
  </section>
}
