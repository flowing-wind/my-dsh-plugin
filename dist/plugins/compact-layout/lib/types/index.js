import z from '@deepseek-ai/schemastery';
/** Normal right-panel width, constrained to the official layout minimum. */
export const Config = z.object({ initialWidth: z.natural().min(300).max(2000).default(300).volatile() });
/** Expose the validated width through the official configuration forms.
 * @param ctx - Host plugin lifecycle.
 */
export function apply(ctx) {
    ctx.inject(['settings'], child => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)); });
}
//# sourceMappingURL=index.js.map