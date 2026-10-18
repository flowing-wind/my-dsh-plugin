/** On-demand API balance with official billing destinations. */
import type { Context } from '@deepseek-ai/cordis'
import { useEffect, useState } from 'react'
import { Button, IconUserOutlineMedium, IconRightUpOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { balanceSchema } from '../wire.ts'
import type { z } from 'zod'
import { zh, en } from './locales.ts'
import css from './view.module.css'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { accountBalance: keyof typeof zh } }

function Balance({ t }: PropsLocale<'accountBalance'>) {
  const [balance, setBalance] = useState<z.infer<typeof balanceSchema>>()
  const [error, setError] = useState<'error' | 'missing'>()
  const [loading, setLoading] = useState(true)
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setError(undefined)
    void (async () => {
      try {
        const response = await fetch('/api/account-balance', { signal: abort.signal })
        if (response.status === 409) { if (!abort.signal.aborted) setError('missing'); return }
        if (!response.ok) throw new Error('Balance request failed')
        const value = balanceSchema.parse(await response.json())
        if (!abort.signal.aborted) setBalance(value)
      } catch (_failure) { if (!abort.signal.aborted) setError('error') }
      finally { if (!abort.signal.aborted) setLoading(false) }
    })()
    return () => { abort.abort() }
  }, [generation])
  return <section data-account-balance className={css.section} aria-label={t('title')}>
    <div className={css.card}>
      <div className={css.identity}>
        <span className={css.avatar}><IconUserOutlineMedium size={20}/></span>
        <div className={css.identityCopy}><span className={css.name}>{t('provider')}</span><span className={css.secondary}>{t('description')}</span></div>
      </div>
      <Button disabled={loading} variant="outline" className={css.refresh} onClick={() =>{  setGeneration(value => value + 1) }}>{t('refresh')}</Button>
    </div>
    <div className={css.balanceCard} aria-busy={loading}>
      {balance?.balance_infos.map(wallet => <dl key={wallet.currency} className={css.balances}>
        {([['toppedUp', wallet.topped_up_balance], ['grant', wallet.granted_balance], ['total', wallet.total_balance]] as const)
          .map(([label, amount]) => <div key={label} className={css.row}>
            <dt>{t(label)}</dt>
            <dd className={css.amount}>
              {wallet.currency === 'CNY' ? `¥${amount}` : wallet.currency === 'USD' ? `$${amount}` : `${amount} ${wallet.currency}`}
            </dd>
          </div>)}
      </dl>)}
      {loading && <p className={css.message} role="status">{t('loading')}</p>}{error && <p className={css.message} role="alert">{t(error)}</p>}
      <div className={css.footer}>
        <a className={css.platform} href="https://platform.deepseek.com" target="_blank" rel="noreferrer">{t('platform')}<IconRightUpOutlineRegular size={12}/></a>
        <div className={css.links}>
          <a className={css.linkButton} href="https://platform.deepseek.com/usage" target="_blank" rel="noreferrer">{t('usage')}</a>
          <a className={`${css.linkButton} ${css.primary}`} href="https://platform.deepseek.com/top_up" target="_blank" rel="noreferrer">{t('topUp')}</a>
        </div>
      </div>
    </div>
  </section>
}

/** Settings and locale owners. */
export const inject = ['slots', 'locale']
/** @param ctx - Browser settings lifecycle. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('accountBalance', { zh, en }))
  const t = ctx.locale.bind('accountBalance')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'account-balance', order: 5, label: () => t('title'), locale: 'accountBalance',
  }, Balance))
}
