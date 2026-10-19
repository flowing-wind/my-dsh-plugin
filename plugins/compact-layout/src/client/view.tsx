/** Compact right-panel preference and official sidebar artwork. */
import type { Context } from '@deepseek-ai/cordis'
import { useEffect, useSyncExternalStore } from 'react'
import { BrandWordmark } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { createLayoutStore } from '@deepseek-ai/dsh-client-ui-layout/src/client/stores.ts'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'

type LayoutStore = ReturnType<typeof createLayoutStore>
type WidthSettings = { initialWidth: number }

function WidthPreference({ actions, form }: Pick<PropsStore<LayoutStore>, 'actions'> & { form: ConfigForm<WidthSettings> }) {
  const initialWidth = useSyncExternalStore(listener => form.subscribe(listener), () => form.getSnapshot()).value?.initialWidth
  useEffect(() => {
    if (initialWidth !== undefined) actions.setRightbar(initialWidth)
  }, [actions, initialWidth])
  return null
}

function BrandName() { return <BrandWordmark includeMark={false} /> }

/** Required official UI services. */
export const inject = ['slots', 'configForms']

/** Share the root's registered store through the slot renderer.
 * @param ctx - Client plugin lifecycle.
 */
export function apply(ctx: Context): void {
  ctx.slots.inject('shell.overlay', () => {
    // shortcut: 0.2.1-rc.2 shares this root store; use a public width service when one is released.
    const store = ctx.slots.entriesOfSlot('root')[0]!.store as LayoutStore
    return ctx.slots.register({ name: 'shell.overlay', id: 'compact-layout', store,
      inject: () => ({ form: ctx.configForms.get<WidthSettings>('compact-layout') }),
    }, WidthPreference)
  })
  ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({ name: 'sidebar.brand.name' }, BrandName))
}
