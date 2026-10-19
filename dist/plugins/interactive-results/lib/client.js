window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-experimental-interactive-results",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let zod = require("zod");
		//#region lib/types/wire.js
		/** Declarative result format; no executable code or remote resources. */
		/** Agent-authored tables, bar charts, and explicitly submitted forms. */
		const resultSchema = zod.z.object({
			title: zod.z.string(),
			blocks: zod.z.array(zod.z.discriminatedUnion("type", [
				zod.z.object({
					type: zod.z.literal("table"),
					columns: zod.z.array(zod.z.string()).min(1),
					rows: zod.z.array(zod.z.array(zod.z.string()))
				}),
				zod.z.object({
					type: zod.z.literal("bar"),
					entries: zod.z.array(zod.z.object({
						label: zod.z.string(),
						value: zod.z.number().finite().nonnegative()
					}))
				}),
				zod.z.object({
					type: zod.z.literal("form"),
					fields: zod.z.array(zod.z.object({
						name: zod.z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
						label: zod.z.string(),
						type: zod.z.enum([
							"text",
							"number",
							"select"
						]),
						options: zod.z.array(zod.z.string()).optional()
					}))
				})
			]))
		});
		//#endregion
		//#region \0dsh-css:/home/fuuraiko/Projects/deepseek-harness/.codex/rollout-20261019/harness/packages/experimental/interactive-results/src/client/view.module.css.mjs
		const css = ".c4RWYa_result{border:1px solid #8884;border-radius:18px;min-width:0;margin:20px 0;padding:20px}.c4RWYa_result h3{margin:0 0 12px}.c4RWYa_result p{opacity:.65;font-size:12px;line-height:1.6}.c4RWYa_block{margin-top:20px}.c4RWYa_result input,.c4RWYa_result select,.c4RWYa_result button{box-sizing:border-box;max-width:100%;min-height:44px;color:inherit;background:0 0;border:1px solid #8884;border-radius:9px;padding:9px 12px}.c4RWYa_result option{color:canvastext;background:canvas}.c4RWYa_result label{flex-direction:column;gap:8px;margin:14px 0;display:flex}.c4RWYa_result button{cursor:pointer;background:#438c7822}.c4RWYa_table{max-height:420px;margin-top:12px;overflow:auto}.c4RWYa_table table{border-collapse:collapse;width:100%}.c4RWYa_table th,.c4RWYa_table td{text-align:left;white-space:nowrap;border-bottom:1px solid #8883;padding:10px}.c4RWYa_bar{grid-template-columns:minmax(60px,1fr) 2fr auto;align-items:center;gap:12px;margin:16px 0;font-size:13px;display:grid}.c4RWYa_bar div{background:#8882;border-radius:5px;height:20px;overflow:hidden}.c4RWYa_bar i{background:#49a68c;height:100%;display:block}.c4RWYa_bar span{overflow-wrap:anywhere}@media (width<=700px){.c4RWYa_result{padding:14px}.c4RWYa_result input,.c4RWYa_result select{font-size:16px}}";
		const tagId = "@deepseek-ai/dsh-experimental-interactive-results/view.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-experimental-interactive-results";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var view_module_css_default = {
			"bar": "c4RWYa_bar",
			"block": "c4RWYa_block",
			"result": "c4RWYa_result",
			"table": "c4RWYa_table"
		};
		//#endregion
		//#region lib/types/client/locales.js
		/** Localized feature labels. */
		const zh = {
			title: "交互结果",
			search: "筛选表格",
			send: "将表单发送给 Agent",
			sent: "已发送到对话",
			sending: "正在发送…",
			failed: "无法显示或提交：{message}",
			loading: "正在读取交互结果…",
			local: "筛选和填写在浏览器内完成；点击发送后才调用 Agent。"
		};
		/** English counterpart. */
		const en = {
			title: "Interactive result",
			search: "Filter table",
			send: "Send form to Agent",
			sent: "Sent to conversation",
			sending: "Sending…",
			failed: "Could not display or submit: {message}",
			loading: "Loading interactive result…",
			local: "Filtering and editing are local. Only submitting the form calls the Agent."
		};
		//#endregion
		//#region lib/types/client/view.js
		function Result({ sessionId, path, t, send }) {
			const [data, setData] = (0, react.useState)();
			const [error, setError] = (0, react.useState)(""), [query, setQuery] = (0, react.useState)(""), [status, setStatus] = (0, react.useState)();
			(0, react.useEffect)(() => {
				const abort = new AbortController();
				(async () => {
					try {
						const response = await fetch(`/api/interactive-results?${new URLSearchParams({
							sessionId,
							path
						})}`, { signal: abort.signal });
						if (!response.ok) throw Error(await response.text());
						const value = resultSchema.parse(await response.json());
						if (!abort.signal.aborted) setData(value);
					} catch (error) {
						if (!abort.signal.aborted) setError(String(error));
					}
				})();
				return () => abort.abort();
			}, [sessionId, path]);
			const submit = async (form, index) => {
				setStatus({
					index,
					phase: "sending"
				});
				try {
					const fields = Object.fromEntries(new FormData(form).entries());
					await send(`${data?.title}\n${JSON.stringify(fields, null, 2)}`);
					setStatus({
						index,
						phase: "sent"
					});
					setError("");
				} catch (error) {
					setError(String(error));
					setStatus(void 0);
				}
			};
			const maxima = data?.blocks.map((block) => block.type === "bar" ? block.entries.reduce((max, entry) => Math.max(max, entry.value), 1) : 1) ?? [];
			return (0, react_jsx_runtime.jsxs)("section", {
				className: view_module_css_default.result,
				"aria-label": t("title"),
				children: [
					(0, react_jsx_runtime.jsx)("h3", { children: data?.title ?? t("loading") }),
					error && (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: t("failed", { message: error })
					}),
					data && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("p", { children: t("local") }), data.blocks.map((block, index) => (0, react_jsx_runtime.jsx)("div", {
						className: view_module_css_default.block,
						children: block.type === "table" ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("input", {
							"aria-label": t("search"),
							placeholder: t("search"),
							value: query,
							onChange: (e) => setQuery(e.target.value)
						}), (0, react_jsx_runtime.jsx)("div", {
							className: view_module_css_default.table,
							children: (0, react_jsx_runtime.jsxs)("table", { children: [(0, react_jsx_runtime.jsx)("thead", { children: (0, react_jsx_runtime.jsx)("tr", { children: block.columns.map((column, i) => (0, react_jsx_runtime.jsx)("th", { children: column }, i)) }) }), (0, react_jsx_runtime.jsx)("tbody", { children: block.rows.filter((row) => row.some((value) => value.toLowerCase().includes(query.toLowerCase()))).map((row, i) => (0, react_jsx_runtime.jsx)("tr", { children: row.map((value, j) => (0, react_jsx_runtime.jsx)("td", { children: value }, j)) }, i)) })] })
						})] }) : block.type === "bar" ? (0, react_jsx_runtime.jsx)("div", { children: block.entries.map((entry, i) => (0, react_jsx_runtime.jsxs)("div", {
							className: view_module_css_default.bar,
							children: [
								(0, react_jsx_runtime.jsx)("span", { children: entry.label }),
								(0, react_jsx_runtime.jsx)("div", { children: (0, react_jsx_runtime.jsx)("i", { style: { width: `${entry.value / maxima[index] * 100}%` } }) }),
								(0, react_jsx_runtime.jsx)("strong", { children: entry.value.toLocaleString() })
							]
						}, i)) }) : (0, react_jsx_runtime.jsxs)("form", {
							onSubmit: (event) => {
								event.preventDefault();
								submit(event.currentTarget, index);
							},
							children: [
								block.fields.map((field) => (0, react_jsx_runtime.jsxs)("label", { children: [field.label, field.type === "select" ? (0, react_jsx_runtime.jsx)("select", {
									name: field.name,
									children: field.options?.map((option) => (0, react_jsx_runtime.jsx)("option", { children: option }, option))
								}) : (0, react_jsx_runtime.jsx)("input", {
									name: field.name,
									type: field.type,
									required: true
								})] }, field.name)),
								(0, react_jsx_runtime.jsx)("button", {
									disabled: status?.phase === "sending",
									type: "submit",
									children: t(status?.index === index && status.phase === "sending" ? "sending" : "send")
								}),
								status?.index === index && status.phase === "sent" && (0, react_jsx_runtime.jsx)("p", {
									role: "status",
									children: t("sent")
								})
							]
						})
					}, index))] })
				]
			});
		}
		function Deliveries(props) {
			const files = props.turn.data.get("deliverables")?.presented?.filter((file) => file.seq < props.seq && file.path.endsWith(".interactive.json")) ?? [];
			return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: [...new Map(files.map((file) => [file.path, file])).values()].map((file) => (0, react_jsx_runtime.jsx)(Result, {
				sessionId: props.sessionId,
				path: file.path,
				t: props.t,
				send: props.send
			}, file.path)) });
		}
		/** Existing delivery and conversation owners. */
		const inject = [
			"slots",
			"locale",
			"sessions"
		];
		/** @param ctx - Browser context. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("interactiveResults", {
				zh,
				en
			}));
			ctx.slots.inject("conversation.chat.turnTail", () => ctx.slots.register({
				name: "conversation.chat.turnTail",
				id: "interactive-results",
				locale: "interactiveResults",
				inject: (sessionId) => ({ send: (text) => ctx.sessions.scope(sessionId).conversation.send(text) })
			}, Deliveries));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map