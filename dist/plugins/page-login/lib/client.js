window.__ModuleLoader__.load({
	id: "@flowing-wind/dsh-page-login",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region \0dsh-css:/home/fuuraiko/.local/share/deepseek-harness/releases/0.2.1-rc.2/packages/experimental/page-login/src/client/view.module.css.mjs
		const css = ".gGD53q_trigger{box-sizing:border-box;border-radius:var(--dsw-radius-md);width:100%;height:44px;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:0 0;border:0;align-items:center;gap:8px;padding:6px;font-size:14px;display:flex}.gGD53q_trigger[data-collapsed=true]{justify-content:center;width:36px;height:36px;padding:0}.gGD53q_trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}.gGD53q_trigger:focus-visible{outline-offset:2px;outline:2px solid}.gGD53q_avatar{background:var(--dsw-alias-bg-skeleton);width:24px;height:24px;color:var(--dsw-alias-label-tertiary);border-radius:50%;flex:none;place-items:center;display:grid}";
		const tagId = "@flowing-wind/dsh-page-login/view.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@flowing-wind/dsh-page-login";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var view_module_css_default = {
			"avatar": "gGD53q_avatar",
			"trigger": "gGD53q_trigger"
		};
		//#endregion
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
					className: view_module_css_default.trigger,
					"data-collapsed": !wide,
					"data-page-logout": true,
					"aria-label": t("logout"),
					onClick: () => globalThis.__DSH_PAGE_LOGOUT__?.(),
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: view_module_css_default.avatar,
						children: (0, react_jsx_runtime.jsx)("svg", {
							width: "16",
							height: "16",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.8",
							"aria-hidden": "true",
							children: (0, react_jsx_runtime.jsx)("path", { d: "M14 8V5H5v14h9v-3M10 12h11m-4-4 4 4-4 4" })
						})
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