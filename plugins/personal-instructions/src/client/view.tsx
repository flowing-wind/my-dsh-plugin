/** Settings editor for the Harness global AGENTS.md file. */
import type { Context } from '@deepseek-ai/cordis'
import { useEffect, useId, useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { zh, en } from './locales.ts'
import css from './view.module.css'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { personalInstructions: keyof typeof zh } }

function Settings({ t }: PropsLocale<'personalInstructions'>) {
  const headingId = useId()
  const [value, setValue] = useState('')
  const [revision, setRevision] = useState<string>()
  const [status, setStatus] = useState('')
  useEffect(() => { void fetch('/api/personal-instructions').then(async (response) => {
    if (!response.ok) throw new Error(String(response.status))
    const current: { content: string; revision: string } = await response.json()
    setValue(current.content)
    setRevision(current.revision)
  }).catch((_error: unknown) => { setStatus(t('loadFailed')) }) }, [t])
  const save = async () => {
    if (revision === undefined) return
    setStatus(t('saving'))
    try {
      const response = await fetch('/api/personal-instructions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: value, revision }) })
      if (response.status === 409) {
        setStatus(t('conflict'))
        return
      }
      if (!response.ok) throw new Error(String(response.status))
      const result: { revision: string } = await response.json()
      setRevision(result.revision)
      setStatus(t('saved'))
    } catch (error) { setStatus(t('failed', { message: String(error) })) }
  }
  return (
    <section className={css.section} data-personal-instructions>
      <header className={css.header}>
        <h2 id={headingId} className={css.heading}>{t('heading')}</h2>
        <p id={`${headingId}-description`} className={css.description}>{t('description')}</p>
      </header>
      <textarea
        className={css.editor}
        rows={16}
        aria-labelledby={headingId}
        aria-describedby={`${headingId}-description`}
        placeholder={t('placeholder')}
        value={value}
        disabled={revision === undefined}
        onChange={(event) => { setValue(event.target.value); setStatus('') }}
      />
      <div className={css.actions}>
        <span className={css.status} role="status">{status}</span>
        <Button variant="primary" disabled={revision === undefined || status === t('saving')} onClick={() => { void save() }}>{t('save')}</Button>
      </div>
    </section>
  )
}

/** Required settings and locale services. */
export const inject = ['slots', 'locale']
/** @param ctx - Browser settings lifecycle. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('personalInstructions', { zh, en }))
  const t = ctx.locale.bind('personalInstructions')
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'personal-instructions', order: 12, label: () => t('title'), locale: 'personalInstructions' }, Settings))
}
