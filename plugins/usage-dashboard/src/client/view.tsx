/** Usage dashboard chrome; feature plugins own their data and sections. */
import type { ReactNode } from 'react'
import type { PropsLocale, PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import css from './view.module.css'

/** @returns Unified usage navigation icon. */
export function DashboardIcon(): ReactNode {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 16v-4m5 4V7m5 9v-6"/></svg>
}

/** @param props - Localized chrome and independently registered sections. @returns Unified dashboard. */
export function Dashboard({ t, renderSlot }: PropsLocale<'usageDashboard'> & PropsRenderSlots<'usage-dashboard.section'>): ReactNode {
  return <main className={css.page}>
    <header className={css.heading}><h1>{t('title')}</h1><p>{t('subtitle')}</p></header>
    <div className={css.sections}>{renderSlot('usage-dashboard.section', {})}</div>
  </main>
}
