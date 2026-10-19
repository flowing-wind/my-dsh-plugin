/** Host configuration for the compact right panel. */
import type { Context, Volatile } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

/** Live default width shared with browser clients. */
export interface Config {
  /** Initial normal right-panel width in pixels. Dragging adjusts the current window. */
  initialWidth: Volatile<number>
}

/** Normal right-panel width, constrained to the official layout minimum. */
export const Config = z.object({ initialWidth: z.natural().min(300).max(2000).default(300).volatile() })

/** Expose the validated width through the official configuration forms.
 * @param ctx - Host plugin lifecycle.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], child => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)) })
}
