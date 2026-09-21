/** Declarative result format; no executable code or remote resources. */
import { z } from 'zod'
/** Agent-authored tables, bar charts, and explicitly submitted forms. */
export const resultSchema = z.object({
  title: z.string(),
  blocks: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('table'), columns: z.array(z.string()).min(1), rows: z.array(z.array(z.string())) }),
    z.object({ type: z.literal('bar'), entries: z.array(z.object({ label: z.string(), value: z.number().finite().nonnegative() })) }),
    z.object({ type: z.literal('form'), fields: z.array(z.object({ name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/), label: z.string(), type: z.enum(['text', 'number', 'select']), options: z.array(z.string()).optional() })) }),
  ])),
})
