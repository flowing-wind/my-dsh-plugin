/** Touch navigation and narrow-screen layout, removed together with the plugin. */
import type { Context } from '@deepseek-ai/cordis';
import { zh } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        mobileLayout: keyof typeof zh;
    }
}
/** Browser layout services. */
export declare const inject: string[];
/** @param ctx - Browser context owning removable styles and controls. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=view.d.ts.map