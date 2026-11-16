/** Authenticated settings access to the Harness global AGENTS.md file. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
/** Maximum size accepted by the settings editor. The native loader owns the prompt budget. */
export interface Config {
    /** Maximum UTF-8 file size in bytes. */
    maxBytes: number;
}
/** Bounds writes to the authenticated settings endpoint. */
export declare const Config: schema<Config>;
/** Required authenticated HTTP service. */
export declare const inject: string[];
/**
 * Register the editor for the same Harness home that native instruction loading uses.
 * @param ctx - Authenticated connection lifecycle.
 * @param config - Editor write limit.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map