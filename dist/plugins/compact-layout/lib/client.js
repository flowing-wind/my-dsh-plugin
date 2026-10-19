window.__ModuleLoader__.load({
	id: "@flowing-wind/dsh-compact-layout",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region lib/types/client/view.js
		function WidthPreference({ actions, form }) {
			const initialWidth = (0, react.useSyncExternalStore)((listener) => form.subscribe(listener), () => form.getSnapshot()).value?.initialWidth;
			(0, react.useEffect)(() => {
				if (initialWidth !== void 0) actions.setRightbar(initialWidth);
			}, [actions, initialWidth]);
			return null;
		}
		function BrandName() {
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.BrandWordmark, { includeMark: false });
		}
		/** Required official UI services. */
		const inject = ["slots", "configForms"];
		/** Share the root's registered store through the slot renderer.
		* @param ctx - Client plugin lifecycle.
		*/
		function apply(ctx) {
			ctx.slots.inject("shell.overlay", () => {
				const store = ctx.slots.entriesOfSlot("root")[0].store;
				return ctx.slots.register({
					name: "shell.overlay",
					id: "compact-layout",
					store,
					inject: () => ({ form: ctx.configForms.get("compact-layout") })
				}, WidthPreference);
			});
			ctx.slots.inject("sidebar.brand.name", () => ctx.slots.register({ name: "sidebar.brand.name" }, BrandName));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map