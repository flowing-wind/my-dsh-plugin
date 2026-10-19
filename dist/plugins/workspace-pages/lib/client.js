window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-experimental-workspace-pages",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region ../../util/workspace-path/lib/index.js
		/**
		* The `dsh-resource://file/…` address grammar: how a file is named across the
		* Sidebar and the resource model, built and parsed without touching a
		* filesystem.
		* @module
		*/
		/** The scheme and type every file address opens with. */
		const FILE_ADDRESS_PREFIX = "dsh-resource://file/";
		/** Whether a decoded first path segment is a Windows drive (`C:`). */
		function isDriveSegment(segment) {
			return segment !== void 0 && /^[A-Za-z]:$/.test(segment);
		}
		/**
		* Read a file address back into its parts without resolving `.` or `..`.
		* Query and fragment suffixes are ignored; encoded path segments are decoded.
		* @param address - a candidate address.
		* @returns the parts, or `undefined` when the string is not a `dsh-resource://file/` URI in a known scope with a path, or a segment is not validly encoded.
		*/
		function parseFileAddress(address) {
			try {
				if (!address.startsWith(FILE_ADDRESS_PREFIX)) return void 0;
				const end = address.search(/[?#]/);
				const [scope, ...rest] = address.slice(20, end === -1 ? void 0 : end).split("/");
				if (scope === "session") {
					const [id, ...segments] = rest;
					if (id === void 0 || id === "" || segments.length === 0) return void 0;
					return {
						scope,
						sessionId: decodeURIComponent(id),
						path: segments.map(decodeURIComponent).join("/")
					};
				}
				if (scope === "absolute") {
					const unc = rest[0] === "" && rest.length > 1;
					const segments = (unc ? rest.slice(1) : rest).map(decodeURIComponent);
					if (segments.length === 0 || segments[0] === "") return void 0;
					if (unc) return {
						scope,
						path: `//${segments.join("/")}`
					};
					return {
						scope,
						path: isDriveSegment(segments[0]) ? segments.join("/") : `/${segments.join("/")}`
					};
				}
				return;
			} catch {
				return;
			}
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** Localized feature labels. */
		const zh = {
			download: "新标签页打开",
			preview: "预览",
			files: "网页与文档"
		};
		/** English counterpart. */
		const en = {
			download: "Open in new tab",
			preview: "Preview",
			files: "Pages and documents"
		};
		//#endregion
		//#region lib/types/client/view.js
		function url(sessionId, path) {
			return `/api/workspace-pages?${new URLSearchParams({
				sessionId,
				path
			})}`;
		}
		function DownloadMenu({ tab, sessionId, dismiss, t }) {
			const file = parseFileAddress(tab.contentId);
			if (file === void 0) return null;
			return (0, react_jsx_runtime.jsx)("a", {
				role: "menuitem",
				href: url(file.scope === "session" ? file.sessionId : sessionId, file.path),
				target: "_blank",
				rel: "noopener noreferrer",
				onClick: dismiss,
				children: t("download")
			});
		}
		function FileDownload({ path, sessionId, t }) {
			return (0, react_jsx_runtime.jsx)("a", {
				href: url(sessionId, path),
				target: "_blank",
				rel: "noopener noreferrer",
				title: t("download"),
				"aria-label": `${t("download")}: ${path}`,
				"data-file-action": true,
				children: (0, react_jsx_runtime.jsx)("svg", {
					width: "18",
					height: "18",
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"aria-hidden": "true",
					children: (0, react_jsx_runtime.jsx)("path", { d: "M14 3h7v7M21 3 10 14M11 5H5v14h14v-6" })
				})
			});
		}
		/** File-tree and preview-tab slot owners. */
		const inject = ["slots", "locale"];
		/** @param ctx - Browser slot registry and locale service. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("workspacePages", {
				zh,
				en
			}));
			ctx.slots.inject("sidebar.files.file.action", () => ctx.slots.register({
				name: "sidebar.files.file.action",
				id: "workspace-pages",
				locale: "workspacePages"
			}, FileDownload));
			ctx.slots.inject("sidebar.right.tab.menu.item", () => ctx.slots.register({
				name: "sidebar.right.tab.menu.item",
				id: "workspace-pages",
				locale: "workspacePages"
			}, DownloadMenu));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map