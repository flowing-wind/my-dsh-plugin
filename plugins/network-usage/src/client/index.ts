/** Independently removable network dashboard and spending-confirmation banner. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-experimental-usage-dashboard/client'
import { NetworkPage, TrafficNotice } from './view.tsx'
import { en, zh } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { networkUsage: keyof typeof zh }
}
/** Browser registration dependencies. */
export const inject = ['slots', 'locale']
/** @param ctx - Browser context. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('networkUsage', { en, zh }))
  ctx.slots.inject('usage-dashboard.section', () => ctx.slots.register({ name: 'usage-dashboard.section', id: 'network-usage', order: 1, locale: 'networkUsage' }, NetworkPage))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'network-usage', locale: 'networkUsage' }, TrafficNotice))
}
