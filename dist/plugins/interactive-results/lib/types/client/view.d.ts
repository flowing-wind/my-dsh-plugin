/** Local table search, chart rendering, and explicit form submission. */
import type { Context } from '@deepseek-ai/cordis';
import { zh } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        interactiveResults: keyof typeof zh;
    }
}
/** Existing delivery and conversation owners. */
export declare const inject: string[];
/** @param ctx - Browser context. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=view.d.ts.map