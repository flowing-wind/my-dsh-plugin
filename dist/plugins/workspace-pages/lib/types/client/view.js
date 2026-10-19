import { jsx as _jsx } from "react/jsx-runtime";
import { parseFileAddress } from '@deepseek-ai/dsh-util-workspace-path';
import { zh, en } from "./locales.js";
function url(sessionId, path) {
    return `/api/workspace-pages?${new URLSearchParams({ sessionId, path })}`;
}
function DownloadMenu({ tab, sessionId, dismiss, t }) {
    const file = parseFileAddress(tab.contentId);
    if (file === undefined)
        return null;
    return _jsx("a", { role: "menuitem", href: url(file.scope === 'session' ? file.sessionId : sessionId, file.path), target: "_blank", rel: "noopener noreferrer", onClick: dismiss, children: t('download') });
}
function FileDownload({ path, sessionId, t }) {
    return _jsx("a", { href: url(sessionId, path), target: "_blank", rel: "noopener noreferrer", title: t('download'), "aria-label": `${t('download')}: ${path}`, "data-file-action": true, children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M14 3h7v7M21 3 10 14M11 5H5v14h14v-6" }) }) });
}
/** File-tree and preview-tab slot owners. */
export const inject = ['slots', 'locale'];
/** @param ctx - Browser slot registry and locale service. */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register('workspacePages', { zh, en }));
    ctx.slots.inject('sidebar.files.file.action', () => ctx.slots.register({
        name: 'sidebar.files.file.action', id: 'workspace-pages', locale: 'workspacePages',
    }, FileDownload));
    ctx.slots.inject('sidebar.right.tab.menu.item', () => ctx.slots.register({
        name: 'sidebar.right.tab.menu.item', id: 'workspace-pages', locale: 'workspacePages',
    }, DownloadMenu));
}
//# sourceMappingURL=view.js.map