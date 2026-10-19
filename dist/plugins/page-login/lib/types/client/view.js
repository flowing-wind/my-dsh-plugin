import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
const zh = { logout: '登出' };
const en = { logout: 'Log out' };
function Logout({ wide, t }) {
    return _jsx(Tooltip, { label: t('logout'), disabled: wide, delayMs: 500, children: _jsxs("button", { type: "button", "data-page-logout": true, "aria-label": t('logout'), onClick: () => globalThis.__DSH_PAGE_LOGOUT__?.(), children: [_jsx("svg", { width: wide ? 16 : 18, height: wide ? 16 : 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": true, children: _jsx("path", { d: "M14 8V5H5v14h9v-3M10 12h11m-4-4 4 4-4 4" }) }), wide && _jsx("span", { children: t('logout') })] }) });
}
/** Required sidebar and locale services. */
export const inject = ['slots', 'locale'];
/** @param ctx - Authenticated browser UI lifecycle. */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register('pageLogin', { zh, en }));
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({ name: 'sidebar.footer.action', id: 'page-login', order: 900, locale: 'pageLogin' }, Logout));
}
//# sourceMappingURL=view.js.map