import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Deletion controls in existing menus, archives, and Workspace confirmations. */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import { z } from 'zod';
import { en, zh } from "./locales.js";
import css from './actions.module.css';
const workspacesSchema = z.object({ workspaces: z.array(z.object({ id: z.string(), canDeleteFiles: z.boolean() })) });
function Confirmation({ selected, close, t }) {
    const [files, setFiles] = useState(false);
    const [sessions, setSessions] = useState(false);
    const [canDeleteFiles, setCanDeleteFiles] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (selected.kind !== 'workspace')
            return;
        const abort = new AbortController();
        void (async () => {
            try {
                const response = await fetch('/api/workspace-management', { signal: abort.signal });
                if (!response.ok)
                    throw new Error(await response.text());
                const value = workspacesSchema.parse(await response.json());
                if (!abort.signal.aborted)
                    setCanDeleteFiles(value.workspaces.find(row => row.id === selected.id)?.canDeleteFiles === true);
            }
            catch (failure) {
                if (!abort.signal.aborted)
                    setError(String(failure));
            }
        })();
        return () => { abort.abort(); };
    }, [selected.kind, selected.id]);
    const remove = async () => {
        setPending(true);
        setError('');
        try {
            const response = await fetch('/api/workspace-management.delete', {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ kind: selected.kind, id: selected.id, confirmed: true, deleteFiles: files, deleteSessions: sessions }),
            });
            if (!response.ok)
                throw new Error(await response.text());
            close();
        }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : String(failure));
            setPending(false);
        }
    };
    return _jsxs(Modal, { open: true, onClose: () => { if (!pending)
            close(); }, closeLabel: t('cancel'), title: t('confirmation'), description: selected.title, footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", disabled: pending, onClick: close, children: t('cancel') }), _jsx(Button, { variant: "primary", disabled: pending, onClick: () => { void remove(); }, children: t(pending ? 'pending' : 'confirm') })] }), children: [selected.kind === 'workspace' ? _jsxs("div", { className: css.options, children: [_jsx("p", { children: t('retain') }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: sessions, disabled: pending, onChange: event => setSessions(event.target.checked) }), t('allSessions')] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: files, disabled: pending || !canDeleteFiles, onChange: event => setFiles(event.target.checked) }), t('files')] }), _jsx("small", { children: t(canDeleteFiles ? 'filesNote' : 'filesUnavailable') })] }) : _jsx("p", { children: t('sessionNote') }), error && _jsx("p", { role: "alert", children: t('error', { message: error }) })] });
}
function SessionAction({ sessionId, displayTitle, useMenuOpenState, controller, t }) {
    const [, setMenuOpen] = useMenuOpenState();
    return _jsx("button", { className: css.action, role: "menuitem", onClick: () => {
            controller.select({ kind: 'session', id: sessionId, title: displayTitle });
            setMenuOpen(false);
        }, children: t('deleteSession') });
}
function SessionDialog({ controller, t }) {
    const selected = useSyncExternalStore(controller.subscribe, controller.get);
    return selected === null ? null : _jsx(Confirmation, { selected: selected, close: () => controller.select(null), t: t }, selected.id);
}
function WorkspaceDialog({ workspaceId, title, close, t }) {
    return _jsx(Confirmation, { selected: { kind: 'workspace', id: workspaceId, title }, close: close, t: t }, workspaceId);
}
/** Browser extension services. */
export const inject = ['slots', 'locale'];
/** @param ctx - Existing menu, archive, and layout slot services. */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register('workspaceManagement', { zh, en }));
    let selection = null;
    const listeners = new Set();
    const controller = {
        get: () => selection,
        subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
        select: value => { selection = value; for (const listener of listeners)
            listener(); },
    };
    ctx.slots.inject('sidebar.workspaces.session.menu.item', () => ctx.slots.register({
        name: 'sidebar.workspaces.session.menu.item', id: 'delete-session', locale: 'workspaceManagement', inject: () => ({ controller }),
    }, SessionAction));
    ctx.slots.inject('sidebar.workspaces.delete', () => ctx.slots.register({ name: 'sidebar.workspaces.delete', locale: 'workspaceManagement' }, WorkspaceDialog));
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'delete-session', locale: 'workspaceManagement', inject: () => ({ controller }) }, SessionDialog));
}
//# sourceMappingURL=actions.js.map