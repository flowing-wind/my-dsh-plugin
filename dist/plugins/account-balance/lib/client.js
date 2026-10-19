window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-experimental-account-balance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let zod = require("zod");
		//#region lib/types/wire.js
		/** Provider balance fields shared by the Host and browser. */
		/** Validated balance response; credential fields are excluded. */
		const balanceSchema = zod.z.object({
			is_available: zod.z.boolean(),
			balance_infos: zod.z.array(zod.z.object({
				currency: zod.z.string(),
				total_balance: zod.z.string(),
				granted_balance: zod.z.string(),
				topped_up_balance: zod.z.string()
			}))
		});
		//#endregion
		//#region lib/types/client/locales.js
		/** Chinese API account settings. */
		const zh = {
			title: "API 余额",
			provider: "DeepSeek API",
			description: "当前 API Key 对应的账号余额",
			total: "总余额",
			grant: "赠金余额",
			toppedUp: "充值余额",
			refresh: "刷新余额",
			loading: "正在查询…",
			error: "余额查询失败，请检查 API Key 后重试。",
			missing: "请先在模型设置中添加 DeepSeek API Key。",
			usage: "查询用量",
			topUp: "充值",
			platform: "DeepSeek 开放平台"
		};
		/** English API account settings. */
		const en = {
			title: "API balance",
			provider: "DeepSeek API",
			description: "Account balance for the current API Key",
			total: "Total balance",
			grant: "Granted balance",
			toppedUp: "Topped-up balance",
			refresh: "Refresh balance",
			loading: "Loading…",
			error: "Balance query failed. Check the API Key and try again.",
			missing: "Add a DeepSeek API Key in Model settings first.",
			usage: "View usage",
			topUp: "Top up",
			platform: "DeepSeek Platform"
		};
		//#endregion
		//#region \0dsh-css:/home/fuuraiko/Projects/deepseek-harness/.codex/rollout-20261019/harness/packages/experimental/account-balance/src/client/view.module.css.mjs
		const css = ".vKG0lq_section{color:var(--dsw-alias-label-primary);flex-direction:column;gap:16px;padding:8px 0;font-size:13px;line-height:22px;display:flex}.vKG0lq_card,.vKG0lq_balanceCard{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill);padding:12px 16px}.vKG0lq_card,.vKG0lq_identity,.vKG0lq_row,.vKG0lq_footer,.vKG0lq_links{align-items:center;display:flex}.vKG0lq_card,.vKG0lq_row,.vKG0lq_footer{justify-content:space-between;gap:16px}.vKG0lq_identity{gap:10px;min-width:0;min-height:44px}.vKG0lq_avatar{width:32px;height:32px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-skeleton);border-radius:50%;flex:none;place-items:center;display:grid}.vKG0lq_identityCopy{flex-direction:column;min-width:0;display:flex}.vKG0lq_name{font-size:14px;font-weight:500}.vKG0lq_secondary,.vKG0lq_platform,.vKG0lq_message{color:var(--dsw-alias-label-tertiary)}.vKG0lq_refresh{flex:none}.vKG0lq_balances{margin:0}.vKG0lq_row{box-sizing:border-box;min-height:52px;padding:6px 0}.vKG0lq_row+.vKG0lq_row,.vKG0lq_balances+.vKG0lq_balances{border-top:.5px solid var(--dsw-alias-border-l2)}.vKG0lq_amount{font-variant-numeric:tabular-nums;overflow-wrap:anywhere;text-align:right;margin:0;font-size:20px;font-weight:600;line-height:28px}.vKG0lq_message{margin:0;padding:12px 0}.vKG0lq_footer{border-top:.5px solid var(--dsw-alias-border-l2);flex-wrap:wrap;min-height:52px;padding-top:8px}.vKG0lq_platform{align-items:center;gap:4px;text-decoration:none;display:inline-flex}.vKG0lq_platform:hover{color:var(--dsw-alias-label-primary)}.vKG0lq_links{flex-wrap:wrap;justify-content:flex-end;gap:10px}.vKG0lq_linkButton{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);white-space:nowrap;min-width:58px;height:36px;color:var(--dsw-alias-label-primary);background:0 0;justify-content:center;align-items:center;padding:0 14px;font-size:14px;line-height:22px;text-decoration:none;display:inline-flex}.vKG0lq_linkButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.vKG0lq_primary{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-button-primary-fill);border-color:#0000;font-weight:500}.vKG0lq_primary:hover{background:var(--dsw-alias-button-primary-hover)}.vKG0lq_linkButton:focus-visible,.vKG0lq_platform:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color);outline-offset:2px}@media (width<=700px){.vKG0lq_card{flex-wrap:wrap;gap:10px}.vKG0lq_identity{flex:180px}.vKG0lq_refresh{min-height:44px;margin-left:auto}.vKG0lq_footer{align-items:flex-start;gap:12px}.vKG0lq_links{flex:100%}.vKG0lq_linkButton{min-height:44px}}";
		const tagId = "@deepseek-ai/dsh-experimental-account-balance/view.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-experimental-account-balance";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var view_module_css_default = {
			"amount": "vKG0lq_amount",
			"avatar": "vKG0lq_avatar",
			"balanceCard": "vKG0lq_balanceCard",
			"balances": "vKG0lq_balances",
			"card": "vKG0lq_card",
			"footer": "vKG0lq_footer",
			"identity": "vKG0lq_identity",
			"identityCopy": "vKG0lq_identityCopy",
			"linkButton": "vKG0lq_linkButton",
			"links": "vKG0lq_links",
			"message": "vKG0lq_message",
			"name": "vKG0lq_name",
			"platform": "vKG0lq_platform",
			"primary": "vKG0lq_primary",
			"refresh": "vKG0lq_refresh",
			"row": "vKG0lq_row",
			"secondary": "vKG0lq_secondary",
			"section": "vKG0lq_section"
		};
		//#endregion
		//#region lib/types/client/view.js
		function Balance({ t }) {
			const [balance, setBalance] = (0, react.useState)();
			const [error, setError] = (0, react.useState)();
			const [loading, setLoading] = (0, react.useState)(true);
			const [generation, setGeneration] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				const abort = new AbortController();
				setLoading(true);
				setError(void 0);
				(async () => {
					try {
						const response = await fetch("/api/account-balance", { signal: abort.signal });
						if (response.status === 409) {
							if (!abort.signal.aborted) setError("missing");
							return;
						}
						if (!response.ok) throw new Error("Balance request failed");
						const value = balanceSchema.parse(await response.json());
						if (!abort.signal.aborted) setBalance(value);
					} catch (_failure) {
						if (!abort.signal.aborted) setError("error");
					} finally {
						if (!abort.signal.aborted) setLoading(false);
					}
				})();
				return () => {
					abort.abort();
				};
			}, [generation]);
			return (0, react_jsx_runtime.jsxs)("section", {
				"data-account-balance": true,
				className: view_module_css_default.section,
				"aria-label": t("title"),
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: view_module_css_default.card,
					children: [(0, react_jsx_runtime.jsxs)("div", {
						className: view_module_css_default.identity,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: view_module_css_default.avatar,
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconUserOutlineMedium, { size: 20 })
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: view_module_css_default.identityCopy,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: view_module_css_default.name,
								children: t("provider")
							}), (0, react_jsx_runtime.jsx)("span", {
								className: view_module_css_default.secondary,
								children: t("description")
							})]
						})]
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						disabled: loading,
						variant: "outline",
						className: view_module_css_default.refresh,
						onClick: () => {
							setGeneration((value) => value + 1);
						},
						children: t("refresh")
					})]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: view_module_css_default.balanceCard,
					"aria-busy": loading,
					children: [
						balance?.balance_infos.map((wallet) => (0, react_jsx_runtime.jsx)("dl", {
							className: view_module_css_default.balances,
							children: [
								["toppedUp", wallet.topped_up_balance],
								["grant", wallet.granted_balance],
								["total", wallet.total_balance]
							].map(([label, amount]) => (0, react_jsx_runtime.jsxs)("div", {
								className: view_module_css_default.row,
								children: [(0, react_jsx_runtime.jsx)("dt", { children: t(label) }), (0, react_jsx_runtime.jsx)("dd", {
									className: view_module_css_default.amount,
									children: wallet.currency === "CNY" ? `¥${amount}` : wallet.currency === "USD" ? `$${amount}` : `${amount} ${wallet.currency}`
								})]
							}, label))
						}, wallet.currency)),
						loading && (0, react_jsx_runtime.jsx)("p", {
							className: view_module_css_default.message,
							role: "status",
							children: t("loading")
						}),
						error && (0, react_jsx_runtime.jsx)("p", {
							className: view_module_css_default.message,
							role: "alert",
							children: t(error)
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: view_module_css_default.footer,
							children: [(0, react_jsx_runtime.jsxs)("a", {
								className: view_module_css_default.platform,
								href: "https://platform.deepseek.com",
								target: "_blank",
								rel: "noreferrer",
								children: [t("platform"), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRightUpOutlineRegular, { size: 12 })]
							}), (0, react_jsx_runtime.jsxs)("div", {
								className: view_module_css_default.links,
								children: [(0, react_jsx_runtime.jsx)("a", {
									className: view_module_css_default.linkButton,
									href: "https://platform.deepseek.com/usage",
									target: "_blank",
									rel: "noreferrer",
									children: t("usage")
								}), (0, react_jsx_runtime.jsx)("a", {
									className: `${view_module_css_default.linkButton} ${view_module_css_default.primary}`,
									href: "https://platform.deepseek.com/top_up",
									target: "_blank",
									rel: "noreferrer",
									children: t("topUp")
								})]
							})]
						})
					]
				})]
			});
		}
		/** Settings and locale owners. */
		const inject = ["slots", "locale"];
		/** @param ctx - Browser settings lifecycle. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("accountBalance", {
				zh,
				en
			}));
			const t = ctx.locale.bind("accountBalance");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "account-balance",
				order: 5,
				label: () => t("title"),
				locale: "accountBalance"
			}, Balance));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map