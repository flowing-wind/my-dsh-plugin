import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useSyncExternalStore } from 'react';
import { BrandWordmark } from '@deepseek-ai/dsh-client-ui-primitives';
function WidthPreference({ actions, form }) {
    const initialWidth = useSyncExternalStore(listener => form.subscribe(listener), () => form.getSnapshot()).value?.initialWidth;
    useEffect(() => {
        if (initialWidth !== undefined)
            actions.setRightbar(initialWidth);
    }, [actions, initialWidth]);
    return null;
}
function BrandName() { return _jsx(BrandWordmark, { includeMark: false }); }
/** Required official UI services. */
export const inject = ['slots', 'configForms'];
/** Share the root's registered store through the slot renderer.
 * @param ctx - Client plugin lifecycle.
 */
export function apply(ctx) {
    ctx.slots.inject('shell.overlay', () => {
        // shortcut: 0.2.1-rc.2 shares this root store; use a public width service when one is released.
        const store = ctx.slots.entriesOfSlot('root')[0].store;
        return ctx.slots.register({ name: 'shell.overlay', id: 'compact-layout', store,
            inject: () => ({ form: ctx.configForms.get('compact-layout') }),
        }, WidthPreference);
    });
    ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({ name: 'sidebar.brand.name' }, BrandName));
}
//# sourceMappingURL=view.js.map