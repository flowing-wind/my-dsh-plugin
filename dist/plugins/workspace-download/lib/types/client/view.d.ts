/** Download actions for file rows and preview tabs. */
import { zh } from './locales.ts';
import type { Context } from '@deepseek-ai/cordis';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        workspaceDownload: keyof typeof zh;
    }
}
/** File-tree and preview-tab slot owners. */
export declare const inject: string[];
/** @param ctx - Browser slot registry and locale service. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=view.d.ts.map