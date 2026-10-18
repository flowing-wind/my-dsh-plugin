/** Browser-local wallpapers beside the native Harness appearance. */
import type { Context } from '@deepseek-ai/cordis'
import { useRef, useState, useSyncExternalStore } from 'react'
import { BrandWordmark } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import styles from './skin.css?inline'
import { zh, en } from './locales.ts'
import { compressWallpaper, wallpaperStorage } from './storage.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { glassSkin: keyof typeof zh } }

type Preset = 'native' | 'oregairu' | 'whiteout'
type State = { opacity: number; custom: boolean; image: string; error: string }
type Controller = {
  get: () => State
  subscribe: (listener: () => void) => () => void
  opacity: (value: number) => void
  preset: (name: Preset) => Promise<void>
  image: (file: File) => Promise<void>
}

function Settings({ controller, t }: { controller: Controller } & PropsLocale<'glassSkin'>) {
  const state = useSyncExternalStore(controller.subscribe, controller.get)
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const change = async (action: () => Promise<void>) => {
    setBusy(true)
    try { await action() } finally { setBusy(false) }
  }
  return <section data-glass-settings>
    <h2>{t('title')}</h2>
    <div data-presets role="group" aria-label={t('presets')}>
      {(['native', 'oregairu', 'whiteout'] as const).map(name => <button key={name} disabled={busy}
        aria-pressed={!state.custom && (name === 'native' ? state.image === '' : state.image.endsWith(`/${name}.webp`))}
        onClick={() => { void change(() => controller.preset(name)) }}>
        {name === 'native' ? <span data-native-preview aria-hidden="true"><span/><span/></span>
          : <img src={`/api/glass-skin/${name}.webp`} alt=""/>}
        <span>{t(name)}</span>
      </button>)}
    </div>
    {state.custom && <><div data-glass-preview style={{ backgroundImage: `url(${JSON.stringify(state.image)})` }}/><p>{t('custom')}</p></>}
    <label htmlFor="glass-opacity">{t('opacity')}<output>{state.opacity.toFixed(2)}</output></label>
    <input id="glass-opacity" type="range" min="0" max="1" step="0.01" value={state.opacity}
      disabled={state.image === '' || busy} onChange={(event) =>{  controller.opacity(Number(event.target.value)) }}/>
    <p>{t(state.image === '' ? 'nativeHint' : 'hint')}</p>
    <div data-controls><button disabled={busy} onClick={() => input.current?.click()}>{t('choose')}</button></div>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" hidden aria-label={t('choose')}
      onChange={(event) => { const file = event.target.files?.[0]; if (file) void change(() => controller.image(file)); event.target.value = '' }}/>
    <p>{t('local')}</p>
    {busy && <p role="status">{t('busy')}</p>}
    {state.error && <p role="alert">{t('error', { message: state.error })}</p>}
  </section>
}

/** Browser services used by the background settings and official wordmark. */
export const inject = ['slots', 'locale', 'theme']

/** @param ctx - Browser context owning removable styles and local background preferences. */
export function apply(ctx: Context): void {
  let state: State = { opacity: .7, custom: false, image: '', error: '' }
  const listeners = new Set<() => void>()
  let alive = true
  let objectUrl: string | undefined
  const update = (patch: Partial<State>) => {
    if (!alive) return
    state = { ...state, ...patch }
    document.documentElement.toggleAttribute('data-glass-skin', state.image !== '')
    document.documentElement.style.setProperty('--glass-opacity', String(state.opacity))
    document.documentElement.style.setProperty('--glass-image', state.image === '' ? 'none' : `url(${JSON.stringify(state.image)})`)
    for (const listener of listeners) listener()
  }
  const setImage = (blob: Blob | null, preset: Preset = 'native') => {
    if (!alive) return
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = blob ? URL.createObjectURL(blob) : undefined
    update({ image: objectUrl ?? (preset === 'native' ? '' : `/api/glass-skin/${preset}.webp`), custom: blob !== null, error: '' })
  }
  const controller: Controller = {
    get: () => state,
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    opacity: (value) => {
      try { localStorage.setItem('dsh.glass.opacity', String(value)); update({ opacity: value, error: '' }) }
      catch (error) { update({ error: String(error) }) }
    },
    preset: async (name) => {
      try {
        await wallpaperStorage(null)
        localStorage.setItem('dsh.glass.preset', name)
        ctx.theme.setTheme('dark')
        setImage(null, name)
      } catch (error) { update({ error: String(error) }) }
    },
    image: async (file) => {
      try {
        const blob = await compressWallpaper(file)
        await wallpaperStorage(blob)
        ctx.theme.setTheme('dark')
        setImage(blob)
      } catch (error) { update({ error: String(error) }) }
    },
  }
  ctx.effect(() => ctx.locale.register('glassSkin', { zh, en }))
  ctx.effect(() => {
    alive = true
    const style = document.createElement('style')
    style.dataset.glassSkin = ''
    style.textContent = styles
    document.head.append(style)
    try {
      const saved = localStorage.getItem('dsh.glass.opacity')
      const opacity = saved === null ? .7 : Number(saved)
      if (Number.isFinite(opacity) && opacity >= 0 && opacity <= 1) state = { ...state, opacity }
    } catch (error) { state = { ...state, error: String(error) } }
    update({})
    void wallpaperStorage().then((blob) => {
      const saved = localStorage.getItem('dsh.glass.preset')
      setImage(blob, saved === 'whiteout' || saved === 'oregairu' ? saved : 'native')
    }).catch((error: unknown) => { update({ error: String(error) }) })
    return () => {
      alive = false
      style.remove()
      document.documentElement.removeAttribute('data-glass-skin')
      document.documentElement.style.removeProperty('--glass-opacity')
      document.documentElement.style.removeProperty('--glass-image')
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      listeners.clear()
    }
  })
  const t = ctx.locale.bind('glassSkin')
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'glass-skin', order: 15,
    label: () => t('title'), locale: 'glassSkin', inject: () => ({ controller }) }, Settings))
  ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({ name: 'sidebar.brand.name' },
    () => <BrandWordmark includeMark={false}/>))
}
