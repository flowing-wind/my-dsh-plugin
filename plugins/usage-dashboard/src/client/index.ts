/** Shared navigation and section slots for independently removable usage plugins. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { Dashboard, DashboardIcon } from './view.tsx'
import { en, zh } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { usageDashboard: keyof typeof zh }
  interface SlotMap {
    /** Independently owned statistics sections in the unified dashboard. */
    'usage-dashboard.section': { kind: 'list'; scope: 'root' }
  }
}

/** Browser composition dependencies. */
export const inject = ['slots', 'locale']

/** @param ctx - Browser slot and locale services. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('usageDashboard', { en, zh }))
  const t = ctx.locale.bind('usageDashboard')
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: 'usage-dashboard', locale: 'usageDashboard',
    children: { 'usage-dashboard.section': { kind: 'list', scope: 'root' } },
  }, Dashboard))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id: 'usage-dashboard', order: 5, label: () => t('title'),
  }, DashboardIcon))
}
