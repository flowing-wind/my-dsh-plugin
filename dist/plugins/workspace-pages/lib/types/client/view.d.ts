/** Static-page actions for file rows and preview tabs. */
import type { Context } from '@deepseek-ai/cordis';
import { zh } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        workspacePages: keyof typeof zh;
    }
}
/** File-tree and preview-tab slot owners. */
export declare const inject: string[];
/** @param ctx - Browser slot registry and locale service. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=view.d.ts.map