window.__ModuleLoader__.load({
	id: "@flowing-wind/dsh-workspace-download",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region lib/types/client/locales.js
		/** Download and archive confirmation labels. */
		/** Simplified Chinese download labels. */
		const zh = {
			download: "下载文件",
			preview: "预览",
			files: "交付文件",
			folder: "下载文件夹 ZIP",
			compressing: "正在压缩",
			confirmTitle: "确认下载压缩包",
			confirmSize: "压缩包大小为 {size} MB，超过确认阈值。是否继续下载？",
			confirm: "确认下载",
			cancel: "取消",
			archiveError: "压缩下载失败：{message}",
			skipped: "已跳过 {count} 个符号链接或特殊文件。"
		};
		/** English download labels. */
		const en = {
			download: "Download file",
			preview: "Preview",
			files: "Delivered files",
			folder: "Download folder ZIP",
			compressing: "Compressing",
			confirmTitle: "Confirm archive download",
			confirmSize: "The archive is {size} MB, above the confirmation threshold. Download it?",
			confirm: "Download",
			cancel: "Cancel",
			archiveError: "Archive download failed: {message}",
			skipped: "Skipped {count} symbolic links or special files."
		};
		//#endregion
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
		//#region lib/types/client/view.js
		/** Download actions for file rows and preview tabs. */
		function url(sessionId, path) {
			return `/api/workspace-download?${new URLSearchParams({
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
				download: true,
				onClick: dismiss,
				children: t("download")
			});
		}
		function FileDownload({ path, sessionId, t }) {
			return (0, react_jsx_runtime.jsx)("a", {
				href: url(sessionId, path),
				download: true,
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
					children: (0, react_jsx_runtime.jsx)("path", { d: "M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" })
				})
			});
		}
		function FolderDownload({ path, sessionId, t }) {
			const [busy, setBusy] = (0, react.useState)(false);
			const [prepared, setPrepared] = (0, react.useState)(null);
			const active = (0, react.useRef)(null);
			const request = (0, react.useRef)(null);
			const address = (id, action) => "/api/workspace-archive?" + new URLSearchParams({
				sessionId,
				id,
				...action ? { action } : {}
			}).toString();
			(0, react.useEffect)(() => () => {
				request.current?.abort();
				if (active.current) fetch(address(active.current.id, "cancel"), {
					method: "POST",
					keepalive: true
				}).catch((error) => {
					console.error("Archive cancellation failed", error);
				});
			}, [sessionId, path]);
			const download = (archive) => {
				const anchor = document.createElement("a");
				anchor.href = address(archive.id);
				anchor.download = "";
				document.body.append(anchor);
				anchor.click();
				anchor.remove();
				active.current = null;
				setPrepared(null);
			};
			const prepare = async () => {
				setBusy(true);
				const abort = new AbortController();
				request.current = abort;
				try {
					const response = await fetch(address("", "prepare"), {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ path }),
						signal: abort.signal
					});
					if (!response.ok) throw new Error(await response.text());
					const data = await response.json();
					if (typeof data !== "object" || data === null || !("id" in data) || typeof data.id !== "string" || !("bytes" in data) || typeof data.bytes !== "number" || !("requiresConfirmation" in data) || typeof data.requiresConfirmation !== "boolean" || !("skipped" in data) || typeof data.skipped !== "number") throw new Error("Invalid archive response");
					const archive = {
						id: data.id,
						bytes: data.bytes,
						requiresConfirmation: data.requiresConfirmation,
						skipped: data.skipped
					};
					active.current = archive;
					if (archive.skipped > 0) window.alert(t("skipped", { count: String(archive.skipped) }));
					if (archive.requiresConfirmation) setPrepared(archive);
					else download(archive);
				} catch (error) {
					if (!abort.signal.aborted) window.alert(t("archiveError", { message: String(error) }));
				} finally {
					if (!abort.signal.aborted) setBusy(false);
				}
			};
			const cancel = async () => {
				if (busy || !prepared) return;
				setBusy(true);
				try {
					const response = await fetch(address(prepared.id, "cancel"), { method: "POST" });
					if (!response.ok && response.status !== 404) throw new Error(await response.text());
					active.current = null;
					setPrepared(null);
				} catch (error) {
					window.alert(t("archiveError", { message: String(error) }));
				} finally {
					setBusy(false);
				}
			};
			const confirm = async () => {
				if (!prepared) return;
				setBusy(true);
				try {
					const response = await fetch(address(prepared.id, "confirm"), { method: "POST" });
					if (!response.ok) throw new Error(await response.text());
					download(prepared);
				} catch (error) {
					window.alert(t("archiveError", { message: String(error) }));
				} finally {
					setBusy(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("button", {
				type: "button",
				"data-file-action": true,
				disabled: busy,
				title: t(busy ? "compressing" : "folder"),
				"aria-label": t(busy ? "compressing" : "folder") + ": " + path,
				onClick: () => {
					prepare();
				},
				children: (0, react_jsx_runtime.jsx)("svg", {
					width: "18",
					height: "18",
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"aria-hidden": "true",
					children: (0, react_jsx_runtime.jsx)("path", { d: "M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" })
				})
			}), prepared && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				title: t("confirmTitle"),
				description: t("confirmSize", { size: (prepared.bytes / 1e6).toFixed(2) }),
				closeLabel: t("cancel"),
				onClose: () => {
					cancel();
				},
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					disabled: busy,
					onClick: () => {
						cancel();
					},
					children: t("cancel")
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: busy,
					onClick: () => {
						confirm();
					},
					children: t("confirm")
				})] })
			})] });
		}
		/** File-tree and preview-tab slot owners. */
		const inject = ["slots", "locale"];
		/** @param ctx - Browser slot registry and locale service. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("workspaceDownload", {
				zh,
				en
			}));
			ctx.slots.inject("sidebar.files.directory.action", () => ctx.slots.register({
				name: "sidebar.files.directory.action",
				id: "workspace-folder-download",
				locale: "workspaceDownload"
			}, FolderDownload));
			ctx.slots.inject("sidebar.files.file.action", () => ctx.slots.register({
				name: "sidebar.files.file.action",
				id: "download",
				locale: "workspaceDownload"
			}, FileDownload));
			ctx.slots.inject("sidebar.right.tab.menu.item", () => ctx.slots.register({
				name: "sidebar.right.tab.menu.item",
				id: "workspace-download",
				locale: "workspaceDownload"
			}, DownloadMenu));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map