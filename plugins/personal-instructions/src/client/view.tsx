/** Settings editor for home-scoped personal instructions. */
import type { Context } from '@deepseek-ai/cordis'
import { useEffect, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { zh, en } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { personalInstructions: keyof typeof zh } }

function Settings({ t }: PropsLocale<'personalInstructions'>) {
  const [value, setValue] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState('')
  useEffect(() => { void fetch('/api/personal-instructions').then(async response => {
    if (!response.ok) throw new Error(String(response.status))
    setValue((await response.json() as { content: string }).content); setLoaded(true)
  }).catch(error => setStatus(t('failed', { message: String(error) }))) }, [t])
  const save = async () => {
    setStatus(t('saving'))
    try {
      const response = await fetch('/api/personal-instructions', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: value }) })
      if (!response.ok) throw new Error(String(response.status))
      setStatus(t('saved'))
    } catch (error) { setStatus(t('failed', { message: String(error) })) }
  }
  return <section data-personal-instructions><h2>{t('heading')}</h2><p>{t('description')}</p><textarea aria-label={t('heading')} placeholder={t('placeholder')} value={value} disabled={!loaded} onChange={event => { setValue(event.target.value); setStatus('') }}/><div><span role="status">{status}</span><button type="button" disabled={!loaded || status === t('saving')} onClick={() => { void save() }}>{t('save')}</button></div></section>
}

/** Required settings and locale services. */
export const inject = ['slots', 'locale']
/** @param ctx - Browser settings lifecycle. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('personalInstructions', { zh, en }))
  const t = ctx.locale.bind('personalInstructions')
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'personal-instructions', order: 12, label: () => t('title'), locale: 'personalInstructions' }, Settings))
}
