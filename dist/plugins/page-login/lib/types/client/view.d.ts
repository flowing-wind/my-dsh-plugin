/** Authenticated-page logout action at the sidebar foot. */
import type { Context } from '@deepseek-ai/cordis';
declare const zh: {
    readonly logout: "登出";
};
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        pageLogin: keyof typeof zh;
    }
}
declare global {
    var __DSH_PAGE_LOGOUT__: (() => void) | undefined;
}
/** Required sidebar and locale services. */
export declare const inject: string[];
/** @param ctx - Authenticated browser UI lifecycle. */
export declare function apply(ctx: Context): void;
export {};
//# sourceMappingURL=view.d.ts.map