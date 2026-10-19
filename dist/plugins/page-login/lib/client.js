window.__ModuleLoader__.load({
	id: "@flowing-wind/dsh-page-login",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region lib/types/client/view.js
		const zh = { logout: "登出" };
		const en = { logout: "Log out" };
		function Logout({ wide, t }) {
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: t("logout"),
				disabled: wide,
				delayMs: 500,
				children: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					"data-page-logout": true,
					"aria-label": t("logout"),
					onClick: () => globalThis.__DSH_PAGE_LOGOUT__?.(),
					children: [(0, react_jsx_runtime.jsx)("svg", {
						width: wide ? 16 : 18,
						height: wide ? 16 : 18,
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.8",
						"aria-hidden": true,
						children: (0, react_jsx_runtime.jsx)("path", { d: "M14 8V5H5v14h9v-3M10 12h11m-4-4 4 4-4 4" })
					}), wide && (0, react_jsx_runtime.jsx)("span", { children: t("logout") })]
				})
			});
		}
		/** Required sidebar and locale services. */
		const inject = ["slots", "locale"];
		/** @param ctx - Authenticated browser UI lifecycle. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("pageLogin", {
				zh,
				en
			}));
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "page-login",
				order: 900,
				locale: "pageLogin"
			}, Logout));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map