// @vitest-environment jsdom
import { createElement, type ComponentType } from 'react'
import { render, act, cleanup } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { stubConfigForm } from '@deepseek-ai/dsh-client-test-runtime'
import { createLayoutStore } from '../../../client/ui-layout/src/client/stores.ts'
import { apply } from '../src/client/index.ts'

afterEach(cleanup)

it('shares the root store, applies Host width, and preserves native dragging on reopen', () => {
  const handle = createLayoutStore()
  const instance = handle.create()
  const store = { ...handle, create: () => instance }
  const form = stubConfigForm<{ initialWidth: number }>()
  const rows: { options: Record<string, unknown>; component: ComponentType }[] = []
  apply({ slots: {
    inject: (_: string, fn: () => unknown) => fn(),
    entriesOfSlot: () => [{ store }],
    register: (options: Record<string, unknown>, component: ComponentType) => { rows.push({ options, component }); return () => {} },
  }, configForms: { get: () => form.scope } } as never)
  const row = rows.find(r => r.options.name === 'shell.overlay')!
  expect(row.options.store).toBe(store)
  expect(rows.some(r => r.options.name === 'sidebar.brand.name')).toBe(true)
  const Controller = row.component as ComponentType<{ actions: typeof instance.actions; form: typeof form.scope }>
  render(createElement(Controller, { actions: store.create().actions, form: form.scope }))
  expect(instance.getSnapshot().layoutInfo.rightbar).toBeNull()
  act(() => { form.publish({ status: 'ready', value: { initialWidth: 300 } }) })
  expect(instance.getSnapshot().layoutInfo.rightbar).toBe(300)
  act(() => { instance.actions.setRightbar(420); instance.actions.closeRightbar(); instance.actions.openRightbar(true, false) })
  expect(instance.getSnapshot().layoutInfo.rightbar).toBe(420)
  act(() => { form.publish({ revision: 2 }) })
  expect(instance.getSnapshot().layoutInfo.rightbar).toBe(420)
  act(() => { form.publish({ value: { initialWidth: 360 } }) })
  expect(instance.getSnapshot().layoutInfo.rightbar).toBe(360)
})
