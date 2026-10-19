import type { Context } from '@deepseek-ai/cordis';
import { zh } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        workspaceManagement: keyof typeof zh;
    }
}
/** Browser extension services. */
export declare const inject: string[];
/** @param ctx - Existing menu, archive, and layout slot services. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=actions.d.ts.map