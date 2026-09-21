/** Optional billing dashboard and per-conversation estimate badge. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-experimental-usage-dashboard/client'
import { BillingBadge, BillingPage } from './view.tsx'
import { en, zh } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    usageBilling: keyof typeof zh
  }
}

/** Services needed by the independent billing surface. */
export const inject = ['slots', 'locale']

/** @param ctx - Browser plugin context. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('usageBilling', { en, zh }))
  ctx.slots.inject('usage-dashboard.section', () => ctx.slots.register({
    name: 'usage-dashboard.section', id: 'usage-billing', order: 0, locale: 'usageBilling',
  }, BillingPage))
  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
    name: 'conversation.composer.dock', id: 'usage-billing', order: 5, locale: 'usageBilling',
  }, BillingBadge))
}
