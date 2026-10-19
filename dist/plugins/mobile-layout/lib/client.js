window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-experimental-mobile-layout",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region lib/types/client/locales.js
		/** Localized feature labels. */
		const zh = {
			navigation: "手机导航",
			menu: "展开左侧栏",
			close: "关闭左侧栏"
		};
		/** English counterpart. */
		const en = {
			navigation: "Mobile navigation",
			menu: "Open left sidebar",
			close: "Close left sidebar"
		};
		//#endregion
		//#region lib/types/client/view.js
		const styles = `
[data-mobile-nav],[data-mobile-backdrop]{display:none}
@media(max-width:700px){
html[data-mobile-layout] [data-app-frame]{grid-template-columns:0 minmax(0,1fr) 0!important;height:100dvh;width:100%;}
html[data-mobile-layout] [data-sidebar-col]{position:absolute;inset:0 auto 0 0;width:100%;box-sizing:border-box;z-index:30;box-shadow:20px 0 60px #0006;}
html[data-mobile-layout] [data-sidebar-collapsed] [data-sidebar-col]{display:none;}
html[data-mobile-layout] [data-center-col]{grid-column:2;min-width:0;}
html[data-mobile-layout] header:has([data-conversation-header-leading]){padding-left:52px!important;padding-right:12px!important;}
html[data-mobile-layout] header [class*="titleCluster"]{min-width:0;gap:4px;}
html[data-mobile-layout] header [class*="crumbCurrent"]{font-size:13px;}
html[data-mobile-layout] [data-sidebar-right-panel]{box-sizing:border-box;position:fixed!important;inset:0!important;width:100vw!important;max-width:100vw!important;z-index:40!important;border-radius:0!important;}
html[data-mobile-layout]:has([data-sidebar-right-open]) [data-mobile-nav]{display:none;}
html[data-mobile-layout] [data-rightbar-col]{grid-column:3;}
html[data-mobile-layout] [data-app-frame]>[data-side]{display:none;}

html[data-mobile-layout] [data-sidebar-col] [data-slot="sidebar"]>div{width:100%!important;}
html[data-mobile-layout] [data-mobile-nav]{display:block;position:absolute;top:8px;left:8px;isolation:isolate;border-radius:9px;overflow:hidden;}
html[data-mobile-layout] [data-mobile-nav]::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--dsw-alias-bg-base,#202020);}
html[data-mobile-layout] [data-mobile-nav] button{display:grid;place-items:center;width:44px;height:44px;border:0;border-radius:9px!important;background:transparent!important;color:inherit;cursor:pointer;box-shadow:none!important;}
html[data-mobile-layout] [data-mobile-nav] button:hover{background:#ffffff14!important;}
html[data-mobile-layout]:has([data-app-frame]:not([data-sidebar-collapsed])) [data-mobile-nav]{display:none;}
html[data-mobile-layout] [data-mobile-backdrop]{display:none;position:absolute;inset:0;border:0;background:#0005;}
html[data-mobile-layout]:has([data-app-frame]:not([data-sidebar-collapsed])) [data-mobile-backdrop]{display:block;}
html[data-mobile-layout] [data-sidebar-col]{background:var(--dsw-alias-bg-base,#202020)!important;}
html[data-mobile-layout]:has([data-rightbar-fullscreen]) [data-mobile-nav]{display:none;}
html[data-mobile-layout] textarea,html[data-mobile-layout] input,html[data-mobile-layout] select{font-size:16px;}
html[data-mobile-layout] [role='dialog']{max-width:calc(100vw - 16px);max-height:calc(100dvh - 16px);}
html[data-mobile-layout] [data-shortcut-modal='settings']{flex-direction:column;width:calc(100vw - 16px);height:calc(100dvh - 16px);}
html[data-mobile-layout] [data-shortcut-modal='settings']>nav{width:100%;padding:16px 12px 0;gap:10px;}
html[data-mobile-layout] [data-shortcut-modal='settings']>nav>div:last-child{flex-direction:row;overflow-x:auto;overflow-y:hidden;}
html[data-mobile-layout] [data-shortcut-modal='settings']>nav button{flex-shrink:0;white-space:nowrap;min-height:44px;}
html[data-mobile-layout] [data-shortcut-modal='settings']>div{min-height:0;}
html[data-mobile-layout] [data-sidebar-col] button{min-height:40px;}
html[data-mobile-layout] [data-center-col] table{font-size:12px;}
html[data-mobile-layout] [data-files-entry='file']>a,html[data-mobile-layout] [data-files-entry='file']>button{min-height:44px;align-items:center;}
}
`;
		function Navigation({ t, menu }) {
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("button", {
				"data-mobile-backdrop": true,
				"aria-label": t("close"),
				onClick: menu
			}), (0, react_jsx_runtime.jsx)("nav", {
				"data-mobile-nav": true,
				"aria-label": t("navigation"),
				children: (0, react_jsx_runtime.jsx)("button", {
					onClick: menu,
					"aria-label": t("menu"),
					children: (0, react_jsx_runtime.jsxs)("svg", {
						width: "20",
						height: "20",
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.6",
						"aria-hidden": "true",
						children: [(0, react_jsx_runtime.jsx)("rect", {
							x: "3",
							y: "4",
							width: "18",
							height: "16",
							rx: "3"
						}), (0, react_jsx_runtime.jsx)("path", { d: "M9 4v16" })]
					})
				})
			})] });
		}
		/** Browser layout services. */
		const inject = [
			"slots",
			"locale",
			"layout",
			"sidebarRight"
		];
		/** @param ctx - Browser context owning removable styles and controls. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("mobileLayout", {
				zh,
				en
			}));
			ctx.effect(() => {
				const style = document.createElement("style");
				style.textContent = styles;
				document.head.append(style);
				document.documentElement.setAttribute("data-mobile-layout", "");
				const media = matchMedia("(max-width:700px)");
				const closeSidebar = () => {
					if (media.matches && document.querySelector("[data-app-frame]:not([data-sidebar-collapsed])")) ctx.layout.toggleSidebar();
				};
				const mounted = new MutationObserver(() => {
					if (!document.querySelector("[data-app-frame]")) return;
					mounted.disconnect();
					closeSidebar();
				});
				mounted.observe(document.body, {
					childList: true,
					subtree: true
				});
				closeSidebar();
				media.addEventListener("change", closeSidebar);
				const selected = (event) => {
					if (!matchMedia("(max-width:700px)").matches || !(event.target instanceof Element)) return;
					const target = event.target;
					if (!target.closest("[data-sidebar-col]") || !document.querySelector("[data-app-frame]:not([data-sidebar-collapsed])")) return;
					if (target.closest("[data-sidebar-panel]") || target.closest("[role=\"treeitem\"][aria-selected]") && !target.closest("button")) ctx.layout.toggleSidebar();
				};
				document.addEventListener("click", selected);
				return () => {
					mounted.disconnect();
					media.removeEventListener("change", closeSidebar);
					document.removeEventListener("click", selected);
					style.remove();
					document.documentElement.removeAttribute("data-mobile-layout");
				};
			});
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "mobile-layout",
				locale: "mobileLayout",
				inject: () => ({ menu: () => ctx.layout.toggleSidebar() })
			}, Navigation));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map