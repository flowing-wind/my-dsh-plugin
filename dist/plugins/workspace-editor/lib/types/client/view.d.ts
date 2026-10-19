/** Lightweight text editor attached to existing file-tree actions. */
import type { Context } from '@deepseek-ai/cordis';
import { zh } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        workspaceEditor: keyof typeof zh;
    }
}
/** Optional UI owners are bound through slots. */
export declare const inject: string[];
/** @param ctx - Browser composition context. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=view.d.ts.map