import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Modal, Button } from '@deepseek-ai/dsh-client-ui-primitives';
import { z } from 'zod';
import css from './view.module.css';
import { zh, en } from "./locales.js";
const fileSchema = z.object({ text: z.string(), version: z.string(), path: z.string() });
function Editor({ selected, close, t }) {
    const [original, setOriginal] = useState();
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [generation, setGeneration] = useState(0);
    const dirty = original !== undefined && text !== original.text;
    useEffect(() => {
        const abort = new AbortController();
        setBusy(true);
        void (async () => {
            try {
                const response = await fetch(`/api/workspace-editor?${new URLSearchParams(selected)}`, { signal: abort.signal });
                if (!response.ok)
                    throw new Error(await response.text());
                const value = fileSchema.parse(await response.json());
                if (!abort.signal.aborted) {
                    setOriginal(value);
                    setText(value.text);
                    setError('');
                }
            }
            catch (failure) {
                if (!abort.signal.aborted)
                    setError(String(failure));
            }
            finally {
                if (!abort.signal.aborted)
                    setBusy(false);
            }
        })();
        return () => { abort.abort(); };
    }, [selected, generation]);
    useEffect(() => {
        if (!dirty)
            return;
        const prevent = (event) => { event.preventDefault(); };
        window.addEventListener('beforeunload', prevent);
        return () => { window.removeEventListener('beforeunload', prevent); };
    }, [dirty]);
    const save = async () => {
        if (original === undefined)
            return;
        setBusy(true);
        try {
            const response = await fetch(`/api/workspace-editor?${new URLSearchParams({ sessionId: selected.sessionId })}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...selected, text, version: original.version }) });
            if (!response.ok)
                throw new Error(await response.text());
            const value = fileSchema.parse(await response.json());
            setOriginal(value);
            setError('');
        }
        catch (failure) {
            setError(String(failure));
        }
        finally {
            setBusy(false);
        }
    };
    const allowDiscard = () => !dirty || window.confirm(t('discard'));
    return _jsx(Modal, { open: true, className: css.dialog, contentClassName: css.content, title: t('edit'), closeLabel: t('close'), onClose: () => { if (!busy && allowDiscard())
            close(); }, footer: _jsxs(_Fragment, { children: [_jsx(Button, { disabled: busy, onClick: () => { if (allowDiscard())
                        setGeneration(v => v + 1); }, children: t('reload') }), _jsx(Button, { variant: "primary", disabled: busy || !dirty, onClick: () => { void save(); }, children: t('save') })] }), children: _jsxs("div", { className: css.editor, children: [_jsx("p", { className: css.path, title: selected.path, children: selected.path }), _jsx("p", { role: "status", children: t(busy ? 'loading' : dirty ? 'dirty' : 'saved') }), error && _jsx("p", { role: "alert", children: t('error', { message: error }) }), _jsx("textarea", { "aria-label": selected.path, value: text, onChange: (event) => { setText(event.target.value); }, disabled: busy || original === undefined, spellCheck: false, autoCapitalize: "off", autoCorrect: "off" })] }) });
}
function Action({ path, sessionId, controller, t }) { return _jsx("button", { "data-file-action": true, title: t('edit'), "aria-label": `${t('edit')}: ${path}`, onClick: () => { controller.select({ path, sessionId }); }, children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "m15 4 5 5-11 11H4v-5L15 4Zm-2 2 5 5" }) }) }); }
function Dialog({ controller, t }) { const selected = useSyncExternalStore(controller.subscribe, controller.get); return selected === null ? null : _jsx(Editor, { selected: selected, close: () => { controller.select(null); }, t: t }, `${selected.sessionId}:${selected.path}`); }
/** Optional UI owners are bound through slots. */
export const inject = ['slots', 'locale'];
/** @param ctx - Browser composition context. */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register('workspaceEditor', { zh, en }));
    let selected = null;
    const listeners = new Set();
    const controller = {
        get: () => selected,
        subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
        select: (value) => { selected = value; for (const fn of listeners)
            fn(); },
    };
    ctx.slots.inject('sidebar.files.file.action', () => ctx.slots.register({ name: 'sidebar.files.file.action', id: 'workspace-editor', locale: 'workspaceEditor', inject: () => ({ controller }) }, Action));
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'workspace-editor', locale: 'workspaceEditor', inject: () => ({ controller }) }, Dialog));
}
//# sourceMappingURL=view.js.map