/** Home-scoped personal instructions exposed to the model and settings UI. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
/** Personal instruction file configuration. */
export interface Config {
    /** Home-relative path of the shared personal instruction file. */
    path: string;
    /** Maximum UTF-8 instruction size in bytes. */
    maxBytes: number;
}
/** Personal instruction files remain below the service account home directory. */
export declare const Config: schema<Config>;
/** Required prompt and HTTP services. */
export declare const inject: string[];
/** @param ctx - Prompt and authenticated connection lifecycle. @param config - Home-relative storage settings. */
export declare function apply(ctx: Context, config: Config): Promise<void>;
//# sourceMappingURL=index.d.ts.map