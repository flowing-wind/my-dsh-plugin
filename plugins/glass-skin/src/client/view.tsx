/** Removable glass surfaces and browser-local background controls. */
import type { Context } from '@deepseek-ai/cordis'
import { useRef, useState, useSyncExternalStore } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import styles from './skin.css?inline'
import { installSelectMenus } from './select-menu.ts'
import { zh, en } from './locales.ts'
import { compressWallpaper, wallpaperStorage } from './storage.ts'
declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { glassSkin: keyof typeof zh } }
type State = { opacity: number; custom: boolean; image: string; error: string }
type Controller = { get: () => State; subscribe: (f: () => void) => () => void; opacity: (value: number) => void; preset: (name: 'oregairu' | 'whiteout') => Promise<void>; image: (file: File | null) => Promise<void> }
function Settings({ controller, t }: { controller: Controller } & PropsLocale<'glassSkin'>) {
  const state = useSyncExternalStore(controller.subscribe, controller.get)
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const change = async (file: File | null) => { setBusy(true); try { await controller.image(file) } finally { setBusy(false) } }
  return <section data-glass-settings><h2>{t('title')}</h2><div data-glass-preview style={{ backgroundImage: `url(${JSON.stringify(state.image)})` }} /><p>{t(state.custom ? 'custom' : state.image.endsWith('/whiteout.webp') ? 'whiteout' : 'default')}</p><label htmlFor="glass-opacity">{t('opacity')}<output>{state.opacity.toFixed(2)}</output></label><input id="glass-opacity" type="range" min="0" max="1" step="0.01" value={state.opacity} onChange={e => controller.opacity(Number(e.target.value))}/><p>{t('hint')}</p><div data-presets aria-label={t('presets')}>{(['oregairu', 'whiteout'] as const).map(name => <button key={name} disabled={busy} aria-pressed={!state.custom && state.image.endsWith(`/${name}.webp`)} onClick={() => { void controller.preset(name) }}><img src={`/api/glass-skin/${name}.webp`} alt={t(name)}/><span>{t(name)}</span></button>)}</div><div data-controls><button disabled={busy} onClick={() => input.current?.click()}>{t('choose')}</button><button disabled={busy} onClick={() => { void change(null) }}>{t('reset')}</button></div><input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" hidden aria-label={t('choose')} onChange={e => { const file = e.target.files?.[0]; if(file) void change(file); e.target.value = '' }}/><p>{t('local')}</p>{busy && <p role="status">{t('busy')}</p>}{state.error && <p role="alert">{t('error', { message: state.error })}</p>}</section>
}
/** Optional settings and locale owners. */
export const inject = ['slots', 'locale']
/** @param ctx - Browser plugin scope; removing it releases all visual effects. */
export function apply(ctx: Context): void {
  const defaultImage = '/api/glass-skin/oregairu.webp'
  let state: State = { opacity: .7, custom: false, image: defaultImage, error: '' }
  const listeners = new Set<() => void>()
  let alive = true
  let objectUrl: string | undefined
  const update = (patch: Partial<State>) => { if (!alive) return; state = { ...state, ...patch }; document.documentElement.style.setProperty('--glass-opacity', String(state.opacity)); document.documentElement.style.setProperty('--glass-image', `url(${JSON.stringify(state.image)})`); for(const listener of listeners) listener() }
  const setImage = (blob: Blob | null) => { if (!alive) return; if(objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = blob ? URL.createObjectURL(blob) : undefined; update({ image: objectUrl ?? defaultImage, custom: blob !== null, error: '' }) }
  const controller: Controller = {
    get: () => state,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
    opacity: value => { update({ opacity: value }); try { localStorage.setItem('dsh.glass.opacity', String(value)) } catch(error) { update({ error: String(error) }) } },
    preset: async name => { try { await wallpaperStorage(null); localStorage.setItem('dsh.glass.preset', name); setImage(null); update({ image: `/api/glass-skin/${name}.webp` }) } catch(error) { update({ error: String(error) }) } },
    image: async file => { try { const blob = file ? await compressWallpaper(file) : null; await wallpaperStorage(blob); if(!file) localStorage.removeItem('dsh.glass.preset'); setImage(blob) } catch(error) { update({ error: String(error) }) } },
  }
  ctx.effect(installSelectMenus)
  ctx.effect(() => ctx.locale.register('glassSkin', { zh, en }))
  ctx.effect(() => {
    alive = true
    const style = document.createElement('style'); style.dataset.glassSkin = ''; style.textContent = styles; document.head.append(style)
    document.documentElement.setAttribute('data-glass-skin', '')
    try { const saved = localStorage.getItem('dsh.glass.opacity'); const opacity = saved === null ? .7 : Number(saved); if(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1) state = { ...state, opacity } } catch(error) { state = { ...state, error: String(error) } }
    update({})
    void wallpaperStorage().then(blob => { setImage(blob); const preset = localStorage.getItem('dsh.glass.preset'); if(!blob && preset === 'whiteout') update({ image: '/api/glass-skin/whiteout.webp' }) }).catch(error => update({ error: String(error) }))
    return () => { alive = false; style.remove(); document.documentElement.removeAttribute('data-glass-skin'); document.documentElement.style.removeProperty('--glass-opacity'); document.documentElement.style.removeProperty('--glass-image'); if(objectUrl) URL.revokeObjectURL(objectUrl); listeners.clear() }
  })
  const t = ctx.locale.bind('glassSkin')
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'glass-skin', order: 15, label: () => t('title'), locale: 'glassSkin', inject: () => ({ controller }) }, Settings))
}
