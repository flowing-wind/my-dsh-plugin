import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/** Download actions for file rows and preview tabs. */
import { zh, en } from "./locales.js";
import { useEffect, useRef, useState } from 'react';
import { Modal, Button } from '@deepseek-ai/dsh-client-ui-primitives';
import { parseFileAddress } from '@deepseek-ai/dsh-util-workspace-path';
function url(sessionId, path) {
    return `/api/workspace-download?${new URLSearchParams({ sessionId, path })}`;
}
function DownloadMenu({ tab, sessionId, dismiss, t }) {
    const file = parseFileAddress(tab.contentId);
    if (file === undefined)
        return null;
    return _jsx("a", { role: "menuitem", href: url(file.scope === 'session' ? file.sessionId : sessionId, file.path), download: true, onClick: dismiss, children: t('download') });
}
function FileDownload({ path, sessionId, t }) {
    return _jsx("a", { href: url(sessionId, path), download: true, title: t('download'), "aria-label": `${t('download')}: ${path}`, "data-file-action": true, children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" }) }) });
}
function FolderDownload({ path, sessionId, t }) {
    const [busy, setBusy] = useState(false);
    const [prepared, setPrepared] = useState(null);
    const active = useRef(null);
    const request = useRef(null);
    const address = (id, action) => '/api/workspace-archive?' + new URLSearchParams({ sessionId, id, ...(action ? { action } : {}) }).toString();
    useEffect(() => () => {
        request.current?.abort();
        if (active.current)
            void fetch(address(active.current.id, 'cancel'), { method: 'POST', keepalive: true }).catch((error) => { console.error('Archive cancellation failed', error); });
    }, [sessionId, path]);
    const download = (archive) => {
        const anchor = document.createElement('a');
        anchor.href = address(archive.id);
        anchor.download = '';
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
            const response = await fetch(address('', 'prepare'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path }), signal: abort.signal });
            if (!response.ok)
                throw new Error(await response.text());
            const data = await response.json();
            if (typeof data !== 'object' || data === null || !('id' in data) || typeof data.id !== 'string' || !('bytes' in data) || typeof data.bytes !== 'number' || !('requiresConfirmation' in data) || typeof data.requiresConfirmation !== 'boolean' || !('skipped' in data) || typeof data.skipped !== 'number')
                throw new Error('Invalid archive response');
            const archive = { id: data.id, bytes: data.bytes, requiresConfirmation: data.requiresConfirmation, skipped: data.skipped };
            active.current = archive;
            if (archive.skipped > 0)
                window.alert(t('skipped', { count: String(archive.skipped) }));
            if (archive.requiresConfirmation)
                setPrepared(archive);
            else
                download(archive);
        }
        catch (error) {
            if (!abort.signal.aborted)
                window.alert(t('archiveError', { message: String(error) }));
        }
        finally {
            if (!abort.signal.aborted)
                setBusy(false);
        }
    };
    const cancel = async () => {
        if (busy || !prepared)
            return;
        setBusy(true);
        try {
            const response = await fetch(address(prepared.id, 'cancel'), { method: 'POST' });
            if (!response.ok && response.status !== 404)
                throw new Error(await response.text());
            active.current = null;
            setPrepared(null);
        }
        catch (error) {
            window.alert(t('archiveError', { message: String(error) }));
        }
        finally {
            setBusy(false);
        }
    };
    const confirm = async () => {
        if (!prepared)
            return;
        setBusy(true);
        try {
            const response = await fetch(address(prepared.id, 'confirm'), { method: 'POST' });
            if (!response.ok)
                throw new Error(await response.text());
            download(prepared);
        }
        catch (error) {
            window.alert(t('archiveError', { message: String(error) }));
        }
        finally {
            setBusy(false);
        }
    };
    return _jsxs(_Fragment, { children: [_jsx("button", { type: "button", "data-file-action": true, disabled: busy, title: t(busy ? 'compressing' : 'folder'), "aria-label": t(busy ? 'compressing' : 'folder') + ': ' + path, onClick: () => { void prepare(); }, children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" }) }) }), prepared && _jsx(Modal, { open: true, title: t('confirmTitle'), description: t('confirmSize', { size: (prepared.bytes / 1000000).toFixed(2) }), closeLabel: t('cancel'), onClose: () => { void cancel(); }, footer: _jsxs(_Fragment, { children: [_jsx(Button, { disabled: busy, onClick: () => { void cancel(); }, children: t('cancel') }), _jsx(Button, { variant: "primary", disabled: busy, onClick: () => { void confirm(); }, children: t('confirm') })] }) })] });
}
/** File-tree and preview-tab slot owners. */
export const inject = ['slots', 'locale'];
/** @param ctx - Browser slot registry and locale service. */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register('workspaceDownload', { zh, en }));
    ctx.slots.inject('sidebar.files.directory.action', () => ctx.slots.register({ name: 'sidebar.files.directory.action', id: 'workspace-folder-download', locale: 'workspaceDownload' }, FolderDownload));
    ctx.slots.inject('sidebar.files.file.action', () => ctx.slots.register({
        name: 'sidebar.files.file.action', id: 'download', locale: 'workspaceDownload',
    }, FileDownload));
    ctx.slots.inject('sidebar.right.tab.menu.item', () => ctx.slots.register({
        name: 'sidebar.right.tab.menu.item', id: 'workspace-download', locale: 'workspaceDownload',
    }, DownloadMenu));
}
//# sourceMappingURL=view.js.map