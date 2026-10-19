/** Declarative interactive deliveries with ordinary logged form follow-ups. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
/** Maximum JSON result size. */
export interface Config {
    /** Maximum size of an interactive result document in bytes. */
    maxBytes: number;
}
/** Deployment result size limit. */
export declare const Config: schema<Config>;
/** Existing prompt, file ownership, and authenticated carrier. */
export declare const inject: string[];
/** @param ctx - Host services. @param config - Result size limit. */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map