window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-experimental-workspace-editor",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let zod = require("zod");
		//#region \0dsh-css:/home/fuuraiko/Projects/deepseek-harness/.codex/rollout-20261019/harness/packages/experimental/workspace-editor/src/client/view.module.css.mjs
		const css = ".y3S_da_dialog.y3S_da_dialog{width:min(1200px,100vw - 48px);height:min(900px,100dvh - 48px);max-height:calc(100dvh - 48px)}.y3S_da_content{flex:1;min-height:0}.y3S_da_content>div:last-child{flex:1;min-height:0;margin-top:0}.y3S_da_editor{flex-direction:column;flex:1;width:100%;min-width:0;min-height:0;display:flex}.y3S_da_editor textarea{box-sizing:border-box;resize:none;color:#e9eef5;tab-size:2;white-space:pre;background:#121416;border:1px solid #8884;border-radius:12px;flex:1;width:100%;min-height:0;padding:14px;font:14px/1.6 ui-monospace,monospace;overflow:auto}.y3S_da_editor p{overflow-wrap:anywhere;flex:none;margin:4px 0 10px;font-size:13px}.y3S_da_editor .y3S_da_path{text-overflow:ellipsis;white-space:nowrap;opacity:.7;overflow:hidden}@media (width<=700px){.y3S_da_dialog.y3S_da_dialog{width:calc(100vw - 24px);height:calc(100dvh - 84px);max-height:calc(100dvh - 84px)}.y3S_da_editor textarea{font-size:16px}}";
		const tagId = "@deepseek-ai/dsh-experimental-workspace-editor/view.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-experimental-workspace-editor";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var view_module_css_default = {
			"content": "y3S_da_content",
			"dialog": "y3S_da_dialog",
			"editor": "y3S_da_editor",
			"path": "y3S_da_path"
		};
		//#endregion
		//#region lib/types/client/locales.js
		/** Localized feature labels. */
		const zh = {
			edit: "编辑文件",
			close: "关闭",
			save: "保存",
			reload: "重新读取",
			loading: "正在读取…",
			saved: "已保存",
			dirty: "尚未保存",
			discard: "丢弃未保存的修改？",
			error: "操作失败：{message}"
		};
		/** English counterpart. */
		const en = {
			edit: "Edit file",
			close: "Close",
			save: "Save",
			reload: "Reload",
			loading: "Loading…",
			saved: "Saved",
			dirty: "Unsaved changes",
			discard: "Discard unsaved changes?",
			error: "Operation failed: {message}"
		};
		//#endregion
		//#region lib/types/client/view.js
		const fileSchema = zod.z.object({
			text: zod.z.string(),
			version: zod.z.string(),
			path: zod.z.string()
		});
		function Editor({ selected, close, t }) {
			const [original, setOriginal] = (0, react.useState)();
			const [text, setText] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [generation, setGeneration] = (0, react.useState)(0);
			const dirty = original !== void 0 && text !== original.text;
			(0, react.useEffect)(() => {
				const abort = new AbortController();
				setBusy(true);
				(async () => {
					try {
						const response = await fetch(`/api/workspace-editor?${new URLSearchParams(selected)}`, { signal: abort.signal });
						if (!response.ok) throw new Error(await response.text());
						const value = fileSchema.parse(await response.json());
						if (!abort.signal.aborted) {
							setOriginal(value);
							setText(value.text);
							setError("");
						}
					} catch (failure) {
						if (!abort.signal.aborted) setError(String(failure));
					} finally {
						if (!abort.signal.aborted) setBusy(false);
					}
				})();
				return () => {
					abort.abort();
				};
			}, [selected, generation]);
			(0, react.useEffect)(() => {
				if (!dirty) return;
				const prevent = (event) => {
					event.preventDefault();
				};
				window.addEventListener("beforeunload", prevent);
				return () => {
					window.removeEventListener("beforeunload", prevent);
				};
			}, [dirty]);
			const save = async () => {
				if (original === void 0) return;
				setBusy(true);
				try {
					const response = await fetch(`/api/workspace-editor?${new URLSearchParams({ sessionId: selected.sessionId })}`, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							...selected,
							text,
							version: original.version
						})
					});
					if (!response.ok) throw new Error(await response.text());
					setOriginal(fileSchema.parse(await response.json()));
					setError("");
				} catch (failure) {
					setError(String(failure));
				} finally {
					setBusy(false);
				}
			};
			const allowDiscard = () => !dirty || window.confirm(t("discard"));
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				className: view_module_css_default.dialog,
				contentClassName: view_module_css_default.content,
				title: t("edit"),
				closeLabel: t("close"),
				onClose: () => {
					if (!busy && allowDiscard()) close();
				},
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					disabled: busy,
					onClick: () => {
						if (allowDiscard()) setGeneration((v) => v + 1);
					},
					children: t("reload")
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: busy || !dirty,
					onClick: () => {
						save();
					},
					children: t("save")
				})] }),
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: view_module_css_default.editor,
					children: [
						(0, react_jsx_runtime.jsx)("p", {
							className: view_module_css_default.path,
							title: selected.path,
							children: selected.path
						}),
						(0, react_jsx_runtime.jsx)("p", {
							role: "status",
							children: t(busy ? "loading" : dirty ? "dirty" : "saved")
						}),
						error && (0, react_jsx_runtime.jsx)("p", {
							role: "alert",
							children: t("error", { message: error })
						}),
						(0, react_jsx_runtime.jsx)("textarea", {
							"aria-label": selected.path,
							value: text,
							onChange: (event) => {
								setText(event.target.value);
							},
							disabled: busy || original === void 0,
							spellCheck: false,
							autoCapitalize: "off",
							autoCorrect: "off"
						})
					]
				})
			});
		}
		function Action({ path, sessionId, controller, t }) {
			return (0, react_jsx_runtime.jsx)("button", {
				"data-file-action": true,
				title: t("edit"),
				"aria-label": `${t("edit")}: ${path}`,
				onClick: () => {
					controller.select({
						path,
						sessionId
					});
				},
				children: (0, react_jsx_runtime.jsx)("svg", {
					width: "18",
					height: "18",
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"aria-hidden": "true",
					children: (0, react_jsx_runtime.jsx)("path", { d: "m15 4 5 5-11 11H4v-5L15 4Zm-2 2 5 5" })
				})
			});
		}
		function Dialog({ controller, t }) {
			const selected = (0, react.useSyncExternalStore)(controller.subscribe, controller.get);
			return selected === null ? null : (0, react_jsx_runtime.jsx)(Editor, {
				selected,
				close: () => {
					controller.select(null);
				},
				t
			}, `${selected.sessionId}:${selected.path}`);
		}
		/** Optional UI owners are bound through slots. */
		const inject = ["slots", "locale"];
		/** @param ctx - Browser composition context. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("workspaceEditor", {
				zh,
				en
			}));
			let selected = null;
			const listeners = /* @__PURE__ */ new Set();
			const controller = {
				get: () => selected,
				subscribe: (fn) => {
					listeners.add(fn);
					return () => {
						listeners.delete(fn);
					};
				},
				select: (value) => {
					selected = value;
					for (const fn of listeners) fn();
				}
			};
			ctx.slots.inject("sidebar.files.file.action", () => ctx.slots.register({
				name: "sidebar.files.file.action",
				id: "workspace-editor",
				locale: "workspaceEditor",
				inject: () => ({ controller })
			}, Action));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "workspace-editor",
				locale: "workspaceEditor",
				inject: () => ({ controller })
			}, Dialog));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map