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
html[data-mobile-layout] [data-app-frame]{grid-template-columns:0 minmax(0,1fr) 0!important;height:100dvh;width:100%;}
html[data-mobile-layout] [data-sidebar-col]{position:absolute;inset:0 auto 0 0;width:100%;box-sizing:border-box;z-index:30;box-shadow:20px 0 60px #0006;}
html[data-mobile-layout] [data-sidebar-collapsed] [data-sidebar-col]{display:none;}
html[data-mobile-layout] [data-center-col]{grid-column:2;min-width:0;}
html[data-mobile-layout] header:has([data-conversation-header-leading]){padding-left:52px!important;padding-right:12px!important;}
html[data-mobile-layout] header [class*="titleCluster"]{min-width:0;gap:4px;}
html[data-mobile-layout] header [class*="crumbCurrent"]{font-size:13px;}
html[data-mobile-layout] [data-sidebar-right-panel]{box-sizing:border-box;position:fixed!important;inset:0!important;width:100vw!important;max-width:100vw!important;z-index:40!important;border-radius:0!important;}
html[data-mobile-layout][data-glass-skin] [data-sidebar-right-panel]{background-color:#202020!important;background-image:linear-gradient(rgb(0 0 0 / var(--glass-opacity)),rgb(0 0 0 / var(--glass-opacity))),var(--glass-image)!important;background-position:center!important;background-size:cover!important;background-attachment:fixed!important;}
html[data-mobile-layout]:has([data-sidebar-right-open]) [data-mobile-nav]{display:none;}
html[data-mobile-layout] [data-rightbar-col]{grid-column:3;}
html[data-mobile-layout] [data-app-frame]>[data-side]{display:none;}

html[data-mobile-layout] [data-sidebar-col] [data-slot="sidebar"]>div{width:100%!important;}
html[data-mobile-layout] [data-mobile-nav]{display:block;position:absolute;top:8px;left:8px;}
html[data-mobile-layout] [data-mobile-nav] button{display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:9px!important;background:transparent!important;color:inherit;cursor:pointer;box-shadow:none!important;}
html[data-mobile-layout] [data-mobile-nav] button:hover{background:#ffffff14!important;}
html[data-mobile-layout]:has([data-app-frame]:not([data-sidebar-collapsed])) [data-mobile-nav]{display:none;}
html[data-mobile-layout] [data-mobile-backdrop]{display:none;position:absolute;inset:0;border:0;background:#0005;}
html[data-mobile-layout]:has([data-app-frame]:not([data-sidebar-collapsed])) [data-mobile-backdrop]{display:block;}
html[data-mobile-layout] [data-sidebar-col]{background:var(--dsw-alias-bg-base,#202020)!important;}
html[data-mobile-layout][data-glass-skin] [data-sidebar-col]{background-color:#202020!important;background-image:linear-gradient(rgb(0 0 0 / var(--glass-opacity)),rgb(0 0 0 / var(--glass-opacity))),var(--glass-image)!important;background-position:center!important;background-size:cover!important;background-attachment:fixed!important;}
html[data-mobile-layout]:has([data-rightbar-fullscreen]) [data-mobile-nav]{display:none;}
html[data-mobile-layout] textarea,html[data-mobile-layout] input,html[data-mobile-layout] select{font-size:16px;}
html[data-mobile-layout] [role='dialog']{max-width:calc(100vw - 16px);max-height:calc(100dvh - 16px);}
html[data-mobile-layout] [data-sidebar-col] button{min-height:40px;}
html[data-mobile-layout] [data-center-col] table{font-size:12px;}
html[data-mobile-layout] [data-files-entry='file']>a,html[data-mobile-layout] [data-files-entry='file']>button{min-height:44px;align-items:center;}
}
`
function Navigation({ t, menu }: PropsLocale<'mobileLayout'> & { menu: () => void }) {
  return <><button data-mobile-backdrop aria-label={t('close')} onClick={menu}/><nav data-mobile-nav aria-label={t('navigation')}><button onClick={menu} aria-label={t('menu')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg></button></nav></>
}
/** Browser layout services. */
export const inject = ['slots', 'locale', 'layout', 'sidebarRight']
/** @param ctx - Browser context owning removable styles and controls. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('mobileLayout', { zh, en }))
  ctx.effect(() => {
    const style = document.createElement('style'); style.textContent = styles; document.head.append(style)
    document.documentElement.setAttribute('data-mobile-layout', '')
    const media = matchMedia('(max-width:700px)')
    const closeSidebar = () => {
      if (media.matches && document.querySelector('[data-app-frame]:not([data-sidebar-collapsed])')) ctx.layout.toggleSidebar()
    }
    const mounted = new MutationObserver(() => {
      if (!document.querySelector('[data-app-frame]')) return
      mounted.disconnect()
      closeSidebar()
    })
    mounted.observe(document.body, { childList: true, subtree: true })
    closeSidebar()
    media.addEventListener('change', closeSidebar)
    const selected = (event: MouseEvent) => {
      if (!matchMedia('(max-width:700px)').matches || !(event.target instanceof Element)) return
      const target = event.target
      if (!target.closest('[data-sidebar-col]') || !document.querySelector('[data-app-frame]:not([data-sidebar-collapsed])')) return
      if (target.closest('[data-sidebar-panel]') || target.closest('[role="treeitem"][aria-selected]') && !target.closest('button')) ctx.layout.toggleSidebar()
    }
    document.addEventListener('click', selected)
    return () => { mounted.disconnect(); media.removeEventListener('change', closeSidebar); document.removeEventListener('click', selected); style.remove(); document.documentElement.removeAttribute('data-mobile-layout') }
  })
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'mobile-layout', locale: 'mobileLayout', inject: () => ({ menu: () => ctx.layout.toggleSidebar() }) }, Navigation))
}
