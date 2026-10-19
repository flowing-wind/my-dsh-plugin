window.__ModuleLoader__.load({
	id: "@flowing-wind/dsh-workspace-management",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let zod = require("zod");
		//#region lib/types/client/locales.js
		/** Localized workspace deletion controls. */
		/** Workspace management labels. */
		const zh = {
			deleteSession: "删除对话",
			allSessions: "同时永久删除此工作区的所有对话（含已归档）",
			sessionNote: "永久删除对话记录及用量明细，保留工作区文件。累计统计不会回退。",
			filesUnavailable: "只有配置的可删除工作区根目录下的子目录允许删除磁盘文件。",
			title: "对话与工作区",
			subtitle: "管理保存的对话与工作区，删除前请确认所选内容。",
			sessions: "对话",
			workspaces: "工作区",
			remove: "删除",
			cancel: "取消",
			confirm: "确认删除",
			confirmation: "永久删除所选内容？此操作无法撤销。",
			retain: "工作区目录和文件默认保留，对话记录也会保留。",
			files: "同时永久删除此工作区的磁盘文件",
			filesNote: "此选项会停止相关对话的运行。是否删除记录由上方的对话选项决定。",
			error: "操作未完成：{message}",
			loading: "正在读取…",
			refresh: "刷新",
			pending: "正在删除…",
			empty: "暂无记录"
		};
		/** English workspace management labels. */
		const en = {
			deleteSession: "Delete conversation",
			allSessions: "Also permanently delete all workspace conversations, including archived ones",
			sessionNote: "Permanently deletes the conversation and its usage details. Workspace files and aggregate usage totals are retained.",
			filesUnavailable: "Disk deletion is allowed only below the configured removable workspace root.",
			title: "Conversations & workspaces",
			subtitle: "Manage saved conversations and workspaces. Review your selection before deleting.",
			sessions: "Conversations",
			workspaces: "Workspaces",
			remove: "Delete",
			cancel: "Cancel",
			confirm: "Confirm deletion",
			confirmation: "Permanently delete the selection? This cannot be undone.",
			retain: "Workspace files and conversation logs are retained by default.",
			files: "Also permanently delete files on disk",
			filesNote: "This stops related conversations. The conversation checkbox controls whether their logs are deleted.",
			error: "Operation did not complete: {message}",
			loading: "Loading…",
			refresh: "Refresh",
			pending: "Deleting…",
			empty: "No records"
		};
		//#endregion
		//#region \0dsh-css:/home/fuuraiko/Projects/deepseek-harness/.codex/rollout-20261019/harness/packages/experimental/workspace-management/src/client/actions.module.css.mjs
		const css = ".zEZqJG_action{color:#d55959;text-align:left;font:inherit;cursor:pointer;background:0 0;border:0;border-radius:8px;padding:10px 14px;display:block}.zEZqJG_action[role=menuitem]{width:100%}.zEZqJG_action:hover{background:#b9383818}.zEZqJG_options{flex-direction:column;gap:16px;display:flex}.zEZqJG_options label{align-items:center;gap:10px;display:flex}.zEZqJG_options small{opacity:.65;line-height:1.6}";
		const tagId = "@flowing-wind/dsh-workspace-management/actions.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@flowing-wind/dsh-workspace-management";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var actions_module_css_default = {
			"action": "zEZqJG_action",
			"options": "zEZqJG_options"
		};
		//#endregion
		//#region lib/types/client/actions.js
		/** Deletion controls in existing menus, archives, and Workspace confirmations. */
		const workspacesSchema = zod.z.object({ workspaces: zod.z.array(zod.z.object({
			id: zod.z.string(),
			canDeleteFiles: zod.z.boolean()
		})) });
		function Confirmation({ selected, close, t }) {
			const [files, setFiles] = (0, react.useState)(false);
			const [sessions, setSessions] = (0, react.useState)(false);
			const [canDeleteFiles, setCanDeleteFiles] = (0, react.useState)(false);
			const [pending, setPending] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			(0, react.useEffect)(() => {
				if (selected.kind !== "workspace") return;
				const abort = new AbortController();
				(async () => {
					try {
						const response = await fetch("/api/workspace-management", { signal: abort.signal });
						if (!response.ok) throw new Error(await response.text());
						const value = workspacesSchema.parse(await response.json());
						if (!abort.signal.aborted) setCanDeleteFiles(value.workspaces.find((row) => row.id === selected.id)?.canDeleteFiles === true);
					} catch (failure) {
						if (!abort.signal.aborted) setError(String(failure));
					}
				})();
				return () => {
					abort.abort();
				};
			}, [selected.kind, selected.id]);
			const remove = async () => {
				setPending(true);
				setError("");
				try {
					const response = await fetch("/api/workspace-management.delete", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							kind: selected.kind,
							id: selected.id,
							confirmed: true,
							deleteFiles: files,
							deleteSessions: sessions
						})
					});
					if (!response.ok) throw new Error(await response.text());
					close();
				} catch (failure) {
					setError(failure instanceof Error ? failure.message : String(failure));
					setPending(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: () => {
					if (!pending) close();
				},
				closeLabel: t("cancel"),
				title: t("confirmation"),
				description: selected.title,
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: pending,
					onClick: close,
					children: t("cancel")
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: pending,
					onClick: () => {
						remove();
					},
					children: t(pending ? "pending" : "confirm")
				})] }),
				children: [selected.kind === "workspace" ? (0, react_jsx_runtime.jsxs)("div", {
					className: actions_module_css_default.options,
					children: [
						(0, react_jsx_runtime.jsx)("p", { children: t("retain") }),
						(0, react_jsx_runtime.jsxs)("label", { children: [(0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: sessions,
							disabled: pending,
							onChange: (event) => setSessions(event.target.checked)
						}), t("allSessions")] }),
						(0, react_jsx_runtime.jsxs)("label", { children: [(0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: files,
							disabled: pending || !canDeleteFiles,
							onChange: (event) => setFiles(event.target.checked)
						}), t("files")] }),
						(0, react_jsx_runtime.jsx)("small", { children: t(canDeleteFiles ? "filesNote" : "filesUnavailable") })
					]
				}) : (0, react_jsx_runtime.jsx)("p", { children: t("sessionNote") }), error && (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					children: t("error", { message: error })
				})]
			});
		}
		function SessionAction({ sessionId, displayTitle, useMenuOpenState, controller, t }) {
			const [, setMenuOpen] = useMenuOpenState();
			return (0, react_jsx_runtime.jsx)("button", {
				className: actions_module_css_default.action,
				role: "menuitem",
				onClick: () => {
					controller.select({
						kind: "session",
						id: sessionId,
						title: displayTitle
					});
					setMenuOpen(false);
				},
				children: t("deleteSession")
			});
		}
		function SessionDialog({ controller, t }) {
			const selected = (0, react.useSyncExternalStore)(controller.subscribe, controller.get);
			return selected === null ? null : (0, react_jsx_runtime.jsx)(Confirmation, {
				selected,
				close: () => controller.select(null),
				t
			}, selected.id);
		}
		function WorkspaceDialog({ workspaceId, title, close, t }) {
			return (0, react_jsx_runtime.jsx)(Confirmation, {
				selected: {
					kind: "workspace",
					id: workspaceId,
					title
				},
				close,
				t
			}, workspaceId);
		}
		/** Browser extension services. */
		const inject = ["slots", "locale"];
		/** @param ctx - Existing menu, archive, and layout slot services. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("workspaceManagement", {
				zh,
				en
			}));
			let selection = null;
			const listeners = /* @__PURE__ */ new Set();
			const controller = {
				get: () => selection,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				select: (value) => {
					selection = value;
					for (const listener of listeners) listener();
				}
			};
			ctx.slots.inject("sidebar.workspaces.session.menu.item", () => ctx.slots.register({
				name: "sidebar.workspaces.session.menu.item",
				id: "delete-session",
				locale: "workspaceManagement",
				inject: () => ({ controller })
			}, SessionAction));
			ctx.slots.inject("sidebar.workspaces.delete", () => ctx.slots.register({
				name: "sidebar.workspaces.delete",
				locale: "workspaceManagement"
			}, WorkspaceDialog));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "delete-session",
				locale: "workspaceManagement",
				inject: () => ({ controller })
			}, SessionDialog));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map