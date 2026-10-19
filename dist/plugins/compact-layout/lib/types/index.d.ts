/** Host configuration for the compact right panel. */
import type { Context, Volatile } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Live default width shared with browser clients. */
export interface Config {
    /** Initial normal right-panel width in pixels. Dragging adjusts the current window. */
    initialWidth: Volatile<number>;
}
/** Normal right-panel width, constrained to the official layout minimum. */
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    initialWidth: z<number, number, "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    initialWidth: z<number, number, "volatile-defined">;
}>>, "plain">;
/** Expose the validated width through the official configuration forms.
 * @param ctx - Host plugin lifecycle.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map