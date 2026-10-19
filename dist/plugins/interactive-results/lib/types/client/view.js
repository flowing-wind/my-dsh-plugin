import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { resultSchema } from "../wire.js";
import css from './view.module.css';
import { zh, en } from "./locales.js";
function Result({ sessionId, path, t, send }) {
    const [data, setData] = useState();
    const [error, setError] = useState(''), [query, setQuery] = useState(''), [status, setStatus] = useState();
    useEffect(() => { const abort = new AbortController(); void (async () => { try {
        const response = await fetch(`/api/interactive-results?${new URLSearchParams({ sessionId, path })}`, { signal: abort.signal });
        if (!response.ok)
            throw Error(await response.text());
        const value = resultSchema.parse(await response.json());
        if (!abort.signal.aborted)
            setData(value);
    }
    catch (error) {
        if (!abort.signal.aborted)
            setError(String(error));
    } })(); return () => abort.abort(); }, [sessionId, path]);
    const submit = async (form, index) => {
        setStatus({ index, phase: 'sending' });
        try {
            const fields = Object.fromEntries(new FormData(form).entries());
            await send(`${data?.title}\n${JSON.stringify(fields, null, 2)}`);
            setStatus({ index, phase: 'sent' });
            setError('');
        }
        catch (error) {
            setError(String(error));
            setStatus(undefined);
        }
    };
    const maxima = data?.blocks.map(block => block.type === 'bar' ? block.entries.reduce((max, entry) => Math.max(max, entry.value), 1) : 1) ?? [];
    return _jsxs("section", { className: css.result, "aria-label": t('title'), children: [_jsx("h3", { children: data?.title ?? t('loading') }), error && _jsx("p", { role: "alert", children: t('failed', { message: error }) }), data && _jsxs(_Fragment, { children: [_jsx("p", { children: t('local') }), data.blocks.map((block, index) => _jsx("div", { className: css.block, children: block.type === 'table' ? _jsxs(_Fragment, { children: [_jsx("input", { "aria-label": t('search'), placeholder: t('search'), value: query, onChange: e => setQuery(e.target.value) }), _jsx("div", { className: css.table, children: _jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: block.columns.map((column, i) => _jsx("th", { children: column }, i)) }) }), _jsx("tbody", { children: block.rows.filter(row => row.some(value => value.toLowerCase().includes(query.toLowerCase()))).map((row, i) => _jsx("tr", { children: row.map((value, j) => _jsx("td", { children: value }, j)) }, i)) })] }) })] }) : block.type === 'bar' ? _jsx("div", { children: block.entries.map((entry, i) => _jsxs("div", { className: css.bar, children: [_jsx("span", { children: entry.label }), _jsx("div", { children: _jsx("i", { style: { width: `${entry.value / maxima[index] * 100}%` } }) }), _jsx("strong", { children: entry.value.toLocaleString() })] }, i)) }) : _jsxs("form", { onSubmit: event => { event.preventDefault(); void submit(event.currentTarget, index); }, children: [block.fields.map(field => _jsxs("label", { children: [field.label, field.type === 'select' ? _jsx("select", { name: field.name, children: field.options?.map(option => _jsx("option", { children: option }, option)) }) : _jsx("input", { name: field.name, type: field.type, required: true })] }, field.name)), _jsx("button", { disabled: status?.phase === 'sending', type: "submit", children: t(status?.index === index && status.phase === 'sending' ? 'sending' : 'send') }), status?.index === index && status.phase === 'sent' && _jsx("p", { role: "status", children: t('sent') })] }) }, index))] })] });
}
function Deliveries(props) {
    const files = props.turn.data.get('deliverables')?.presented?.filter(file => file.seq < props.seq && file.path.endsWith('.interactive.json')) ?? [];
    return _jsx(_Fragment, { children: [...new Map(files.map(file => [file.path, file])).values()].map(file => _jsx(Result, { sessionId: props.sessionId, path: file.path, t: props.t, send: props.send }, file.path)) });
}
/** Existing delivery and conversation owners. */
export const inject = ['slots', 'locale', 'sessions'];
/** @param ctx - Browser context. */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register('interactiveResults', { zh, en }));
    ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
        name: 'conversation.chat.turnTail', id: 'interactive-results', locale: 'interactiveResults',
        inject: sessionId => ({ send: (text) => ctx.sessions.scope(sessionId).conversation.send(text) }),
    }, Deliveries));
}
//# sourceMappingURL=view.js.map