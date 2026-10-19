import { expect, it } from 'vitest'
import { Config } from '../src/index.ts'

it('validates the width against the official minimum', () => {
  expect(() => Config({ initialWidth: 299 })).toThrow()
  expect(() => Config({ initialWidth: 2001 })).toThrow()
  expect(() => Config({ initialWidth: 300 })).not.toThrow()
})
