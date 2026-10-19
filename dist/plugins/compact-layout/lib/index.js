import z from "@deepseek-ai/schemastery";
//#region lib/types/index.js
/** Normal right-panel width, constrained to the official layout minimum. */
const Config = z.object({ initialWidth: z.natural().min(300).max(2e3).default(300).volatile() });
/** Expose the validated width through the official configuration forms.
* @param ctx - Host plugin lifecycle.
*/
function apply(ctx) {
	ctx.inject(["settings"], (child) => {
		child.effect(() => child.settings.configure({ auto: false }, ctx.fiber));
	});
}
//#endregion
export { Config, apply };
