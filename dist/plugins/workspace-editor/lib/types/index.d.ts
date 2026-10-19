/** Authenticated UTF-8 editing restricted to an existing conversation workspace. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
/** Maximum editable file size; binary and oversized files remain downloadable. */
export interface Config {
    /** Maximum editable UTF-8 file size in bytes. */
    maxBytes: number;
}
/** Deployment editing limit. */
export declare const Config: schema<Config>;
/** Authenticated transport and persisted workspace ownership. */
export declare const inject: string[];
/** @param ctx - Host services. @param config - Maximum editable UTF-8 file size. */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map