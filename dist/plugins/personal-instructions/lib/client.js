window.__ModuleLoader__.load({
	id: "@flowing-wind/dsh-personal-instructions",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region lib/types/client/locales.js
		const zh = {
			title: "个性化",
			heading: "个性化要求",
			description: "为所有对话向 Agent 提供额外说明和上下文。工作区中的 AGENTS.md 仍会按原有规则生效。",
			save: "保存",
			saved: "已保存",
			saving: "正在保存…",
			failed: "保存失败：{message}",
			placeholder: "填写希望 Agent 始终遵循的要求"
		};
		const en = {
			title: "Personalization",
			heading: "Personal instructions",
			description: "Give the Agent extra instructions and context in every conversation. Workspace AGENTS.md files continue to apply normally.",
			save: "Save",
			saved: "Saved",
			saving: "Saving…",
			failed: "Could not save: {message}",
			placeholder: "Enter instructions the Agent should always follow"
		};
		//#endregion
		//#region \0dsh-css:/home/dsh/deepseek-harness/.codex/personal-instructions-20261022/build/packages/experimental/personal-instructions/src/client/view.module.css.mjs
		const css = ".t9yD5q_section{flex-direction:column;gap:16px;width:100%;min-width:0;display:flex}.t9yD5q_header{flex-direction:column;gap:8px;display:flex}.t9yD5q_heading{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:600;line-height:24px}.t9yD5q_description{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:20px}.t9yD5q_editor{box-sizing:border-box;resize:vertical;border:1px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);width:100%;height:clamp(320px,48vh,520px);min-height:240px;color:var(--dsw-alias-label-primary);border-radius:12px;outline:none;padding:12px 14px;font-family:inherit;font-size:14px;line-height:22px}.t9yD5q_editor::placeholder{color:var(--dsw-alias-label-dimmed)}.t9yD5q_editor:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.t9yD5q_editor:disabled{opacity:.4;cursor:not-allowed}.t9yD5q_actions{justify-content:flex-end;align-items:center;gap:12px;display:flex}.t9yD5q_status{overflow-wrap:anywhere;min-width:0;color:var(--dsw-alias-label-secondary);margin-right:auto;font-size:13px;line-height:20px}";
		const tagId = "@flowing-wind/dsh-personal-instructions/view.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@flowing-wind/dsh-personal-instructions";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var view_module_css_default = {
			"actions": "t9yD5q_actions",
			"description": "t9yD5q_description",
			"editor": "t9yD5q_editor",
			"header": "t9yD5q_header",
			"heading": "t9yD5q_heading",
			"section": "t9yD5q_section",
			"status": "t9yD5q_status"
		};
		//#endregion
		//#region lib/types/client/view.js
		function Settings({ t }) {
			const headingId = (0, react.useId)();
			const [value, setValue] = (0, react.useState)("");
			const [loaded, setLoaded] = (0, react.useState)(false);
			const [status, setStatus] = (0, react.useState)("");
			(0, react.useEffect)(() => {
				fetch("/api/personal-instructions").then(async (response) => {
					if (!response.ok) throw new Error(String(response.status));
					setValue((await response.json()).content);
					setLoaded(true);
				}).catch((error) => {
					setStatus(t("failed", { message: String(error) }));
				});
			}, [t]);
			const save = async () => {
				setStatus(t("saving"));
				try {
					const response = await fetch("/api/personal-instructions", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ content: value })
					});
					if (!response.ok) throw new Error(String(response.status));
					setStatus(t("saved"));
				} catch (error) {
					setStatus(t("failed", { message: String(error) }));
				}
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: view_module_css_default.section,
				"data-personal-instructions": true,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: view_module_css_default.header,
						children: [(0, react_jsx_runtime.jsx)("h2", {
							id: headingId,
							className: view_module_css_default.heading,
							children: t("heading")
						}), (0, react_jsx_runtime.jsx)("p", {
							id: `${headingId}-description`,
							className: view_module_css_default.description,
							children: t("description")
						})]
					}),
					(0, react_jsx_runtime.jsx)("textarea", {
						className: view_module_css_default.editor,
						rows: 16,
						"aria-labelledby": headingId,
						"aria-describedby": `${headingId}-description`,
						placeholder: t("placeholder"),
						value,
						disabled: !loaded,
						onChange: (event) => {
							setValue(event.target.value);
							setStatus("");
						}
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: view_module_css_default.actions,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: view_module_css_default.status,
							role: "status",
							children: status
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							disabled: !loaded || status === t("saving"),
							onClick: () => {
								save();
							},
							children: t("save")
						})]
					})
				]
			});
		}
		/** Required settings and locale services. */
		const inject = ["slots", "locale"];
		/** @param ctx - Browser settings lifecycle. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("personalInstructions", {
				zh,
				en
			}));
			const t = ctx.locale.bind("personalInstructions");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "personal-instructions",
				order: 12,
				label: () => t("title"),
				locale: "personalInstructions"
			}, Settings));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map