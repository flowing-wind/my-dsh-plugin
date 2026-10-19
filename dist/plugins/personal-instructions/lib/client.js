window.__ModuleLoader__.load({
	id: "@flowing-wind/dsh-personal-instructions",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
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
		//#region lib/types/client/view.js
		function Settings({ t }) {
			const [value, setValue] = (0, react.useState)("");
			const [loaded, setLoaded] = (0, react.useState)(false);
			const [status, setStatus] = (0, react.useState)("");
			(0, react.useEffect)(() => {
				fetch("/api/personal-instructions").then(async (response) => {
					if (!response.ok) throw new Error(String(response.status));
					setValue((await response.json()).content);
					setLoaded(true);
				}).catch((error) => setStatus(t("failed", { message: String(error) })));
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
				"data-personal-instructions": true,
				children: [
					(0, react_jsx_runtime.jsx)("h2", { children: t("heading") }),
					(0, react_jsx_runtime.jsx)("p", { children: t("description") }),
					(0, react_jsx_runtime.jsx)("textarea", {
						"aria-label": t("heading"),
						placeholder: t("placeholder"),
						value,
						disabled: !loaded,
						onChange: (event) => {
							setValue(event.target.value);
							setStatus("");
						}
					}),
					(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", {
						role: "status",
						children: status
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !loaded || status === t("saving"),
						onClick: () => {
							save();
						},
						children: t("save")
					})] })
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