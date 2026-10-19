/** On-demand API balance with official billing destinations. */
import type { Context } from '@deepseek-ai/cordis';
import { zh } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        accountBalance: keyof typeof zh;
    }
}
/** Settings and locale owners. */
export declare const inject: string[];
/** @param ctx - Browser settings lifecycle. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=view.d.ts.map