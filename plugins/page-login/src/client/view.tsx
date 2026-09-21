/** Authenticated-page logout action at the sidebar foot. */
import type { Context } from '@deepseek-ai/cordis'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'

const zh = { logout: '登出' } as const
const en: Record<keyof typeof zh, string> = { logout: 'Log out' }
declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { pageLogin: keyof typeof zh } }
declare global { var __DSH_PAGE_LOGOUT__: (() => void) | undefined }

function Logout({ wide, t }: PropsRuntime<'sidebar.footer.action'> & PropsLocale<'pageLogin'>) {
  return <Tooltip label={t('logout')} disabled={wide} delayMs={500}><button type="button" data-page-logout aria-label={t('logout')} onClick={() => globalThis.__DSH_PAGE_LOGOUT__?.()}><svg width={wide ? 16 : 18} height={wide ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M14 8V5H5v14h9v-3M10 12h11m-4-4 4 4-4 4"/></svg>{wide && <span>{t('logout')}</span>}</button></Tooltip>
}

/** Required sidebar and locale services. */
export const inject = ['slots', 'locale']
/** @param ctx - Authenticated browser UI lifecycle. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('pageLogin', { zh, en }))
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({ name: 'sidebar.footer.action', id: 'page-login', order: 900, locale: 'pageLogin' }, Logout))
}
