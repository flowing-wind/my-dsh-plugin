/** Touch navigation and narrow-screen layout, removed together with the plugin. */
import type { Context } from '@deepseek-ai/cordis'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { zh, en } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { mobileLayout: keyof typeof zh } }
const styles = `
[data-mobile-nav]{display:none}
@media(max-width:700px){
html[data-mobile-layout] [data-app-frame]{grid-template-columns:0 minmax(0,1fr) 0!important;height:calc(100dvh - 58px - env(safe-area-inset-bottom));width:100%;}
html[data-mobile-layout] [data-sidebar-col]{position:absolute;inset:0 auto 0 0;width:min(88vw,340px);z-index:30;box-shadow:20px 0 60px #0006;}
html[data-mobile-layout] [data-sidebar-collapsed] [data-sidebar-col]{display:none;}
html[data-mobile-layout] [data-center-col]{grid-column:2;min-width:0;}
html[data-mobile-layout] [data-rightbar-col]{grid-column:3;}
html[data-mobile-layout] [data-app-frame]>[data-side]{display:none;}
html[data-mobile-layout] [data-mobile-nav]{position:fixed;bottom:0;left:0;right:0;z-index:45;display:flex;gap:8px;justify-content:space-around;padding:6px 12px calc(6px + env(safe-area-inset-bottom));background:var(--dsw-alias-bg-base,#191b1e);border-top:1px solid #8884;}
html[data-mobile-layout] [data-mobile-nav] button{min-height:44px;flex:1;border:0;border-radius:12px;background:#8881;color:inherit;font-size:13px;}
html[data-mobile-layout] [data-sidebar-right-panel='fullscreen']{bottom:calc(58px + env(safe-area-inset-bottom));}
html[data-mobile-layout] textarea,html[data-mobile-layout] input,html[data-mobile-layout] select{font-size:16px;}
html[data-mobile-layout] [role='dialog']{max-width:calc(100vw - 16px);max-height:calc(100dvh - 76px);}
html[data-mobile-layout] [data-sidebar-col] button{min-height:40px;}
html[data-mobile-layout] [data-center-col] table{font-size:12px;}
html[data-mobile-layout] [data-files-entry='file']>a,html[data-mobile-layout] [data-files-entry='file']>button{min-height:44px;align-items:center;}
}
`
function Navigation({ t, menu, chat }: PropsLocale<'mobileLayout'> & { menu: () => void; chat: () => void }) { return <nav data-mobile-nav aria-label={t('navigation')}><button onClick={menu}>{t('menu')}</button><button onClick={chat}>{t('chat')}</button></nav> }
/** Browser layout services. */
export const inject = ['slots', 'locale', 'layout', 'sidebarRight']
/** @param ctx - Browser context owning removable styles and controls. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('mobileLayout', { zh, en }))
  ctx.effect(() => {
    const style = document.createElement('style'); style.textContent = styles; document.head.append(style)
    document.documentElement.setAttribute('data-mobile-layout', '')
    const selected = (event: MouseEvent) => {
      if (!matchMedia('(max-width:700px)').matches || !(event.target instanceof Element)) return
      const target = event.target
      if (!target.closest('[data-sidebar-col]') || !document.querySelector('[data-app-frame]:not([data-sidebar-collapsed])')) return
      if (target.closest('[data-sidebar-panel]') || target.closest('[role="treeitem"][aria-selected]') && !target.closest('button')) ctx.layout.toggleSidebar()
    }
    document.addEventListener('click', selected)
    return () => { document.removeEventListener('click', selected); style.remove(); document.documentElement.removeAttribute('data-mobile-layout') }
  })
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'mobile-layout', locale: 'mobileLayout', inject: () => ({ menu: () => ctx.layout.toggleSidebar(), chat: () => { ctx.layout.selectPanel(null); if (ctx.sidebarRight.isExpanded()) ctx.sidebarRight.toggleExpanded(); if (document.querySelector('[data-app-frame]:not([data-sidebar-collapsed])')) ctx.layout.toggleSidebar() } }) }, Navigation))
}
