/** Settings editor for the Harness global AGENTS.md file. */
import type { Context } from '@deepseek-ai/cordis';
import { zh } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        personalInstructions: keyof typeof zh;
    }
}
/** Required settings and locale services. */
export declare const inject: string[];
/** @param ctx - Browser settings lifecycle. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=view.d.ts.map