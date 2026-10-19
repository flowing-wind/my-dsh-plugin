import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { zh, en } from "./locales.js";
function Settings({ t }) {
    const [value, setValue] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [status, setStatus] = useState('');
    useEffect(() => {
        void fetch('/api/personal-instructions').then(async (response) => {
            if (!response.ok)
                throw new Error(String(response.status));
            setValue((await response.json()).content);
            setLoaded(true);
        }).catch(error => setStatus(t('failed', { message: String(error) })));
    }, [t]);
    const save = async () => {
        setStatus(t('saving'));
        try {
            const response = await fetch('/api/personal-instructions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: value }) });
            if (!response.ok)
                throw new Error(String(response.status));
            setStatus(t('saved'));
        }
        catch (error) {
            setStatus(t('failed', { message: String(error) }));
        }
    };
    return _jsxs("section", { "data-personal-instructions": true, children: [_jsx("h2", { children: t('heading') }), _jsx("p", { children: t('description') }), _jsx("textarea", { "aria-label": t('heading'), placeholder: t('placeholder'), value: value, disabled: !loaded, onChange: event => { setValue(event.target.value); setStatus(''); } }), _jsxs("div", { children: [_jsx("span", { role: "status", children: status }), _jsx("button", { type: "button", disabled: !loaded || status === t('saving'), onClick: () => { void save(); }, children: t('save') })] })] });
}
/** Required settings and locale services. */
export const inject = ['slots', 'locale'];
/** @param ctx - Browser settings lifecycle. */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register('personalInstructions', { zh, en }));
    const t = ctx.locale.bind('personalInstructions');
    ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'personal-instructions', order: 12, label: () => t('title'), locale: 'personalInstructions' }, Settings));
}
//# sourceMappingURL=view.js.map