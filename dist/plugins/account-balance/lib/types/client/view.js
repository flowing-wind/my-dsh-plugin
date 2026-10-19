import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button, IconUserOutlineMedium, IconRightUpOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives';
import { balanceSchema } from "../wire.js";
import { zh, en } from "./locales.js";
import css from './view.module.css';
function Balance({ t }) {
    const [balance, setBalance] = useState();
    const [error, setError] = useState();
    const [loading, setLoading] = useState(true);
    const [generation, setGeneration] = useState(0);
    useEffect(() => {
        const abort = new AbortController();
        setLoading(true);
        setError(undefined);
        void (async () => {
            try {
                const response = await fetch('/api/account-balance', { signal: abort.signal });
                if (response.status === 409) {
                    if (!abort.signal.aborted)
                        setError('missing');
                    return;
                }
                if (!response.ok)
                    throw new Error('Balance request failed');
                const value = balanceSchema.parse(await response.json());
                if (!abort.signal.aborted)
                    setBalance(value);
            }
            catch (_failure) {
                if (!abort.signal.aborted)
                    setError('error');
            }
            finally {
                if (!abort.signal.aborted)
                    setLoading(false);
            }
        })();
        return () => { abort.abort(); };
    }, [generation]);
    return _jsxs("section", { "data-account-balance": true, className: css.section, "aria-label": t('title'), children: [_jsxs("div", { className: css.card, children: [_jsxs("div", { className: css.identity, children: [_jsx("span", { className: css.avatar, children: _jsx(IconUserOutlineMedium, { size: 20 }) }), _jsxs("div", { className: css.identityCopy, children: [_jsx("span", { className: css.name, children: t('provider') }), _jsx("span", { className: css.secondary, children: t('description') })] })] }), _jsx(Button, { disabled: loading, variant: "outline", className: css.refresh, onClick: () => { setGeneration(value => value + 1); }, children: t('refresh') })] }), _jsxs("div", { className: css.balanceCard, "aria-busy": loading, children: [balance?.balance_infos.map(wallet => _jsx("dl", { className: css.balances, children: [['toppedUp', wallet.topped_up_balance], ['grant', wallet.granted_balance], ['total', wallet.total_balance]]
                            .map(([label, amount]) => _jsxs("div", { className: css.row, children: [_jsx("dt", { children: t(label) }), _jsx("dd", { className: css.amount, children: wallet.currency === 'CNY' ? `¥${amount}` : wallet.currency === 'USD' ? `$${amount}` : `${amount} ${wallet.currency}` })] }, label)) }, wallet.currency)), loading && _jsx("p", { className: css.message, role: "status", children: t('loading') }), error && _jsx("p", { className: css.message, role: "alert", children: t(error) }), _jsxs("div", { className: css.footer, children: [_jsxs("a", { className: css.platform, href: "https://platform.deepseek.com", target: "_blank", rel: "noreferrer", children: [t('platform'), _jsx(IconRightUpOutlineRegular, { size: 12 })] }), _jsxs("div", { className: css.links, children: [_jsx("a", { className: css.linkButton, href: "https://platform.deepseek.com/usage", target: "_blank", rel: "noreferrer", children: t('usage') }), _jsx("a", { className: `${css.linkButton} ${css.primary}`, href: "https://platform.deepseek.com/top_up", target: "_blank", rel: "noreferrer", children: t('topUp') })] })] })] })] });
}
/** Settings and locale owners. */
export const inject = ['slots', 'locale'];
/** @param ctx - Browser settings lifecycle. */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register('accountBalance', { zh, en }));
    const t = ctx.locale.bind('accountBalance');
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: 'account-balance', order: 5, label: () => t('title'), locale: 'accountBalance',
    }, Balance));
}
//# sourceMappingURL=view.js.map