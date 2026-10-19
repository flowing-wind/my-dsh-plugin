/** Optional authenticated deletion of conversations and workspace registrations. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
/** Optional administrator restriction on removable workspace directories. */
export interface Config {
    /** Existing absolute parent directory; omitted permits eligible registered directories. */
    managedWorkspaceRoot?: string;
}
/** Explicit roots restrict deletion; protected directories are always excluded. */
export declare const Config: schema<Config>;
/** Existing persistence, Agent ownership, and authenticated transport services. */
export declare const inject: string[];
/**
 * Mount management endpoints independently of billing and file browsing.
 * @param ctx - Host service context.
 * @param config - Directory deletion policy.
 */
export declare function apply(ctx: Context, config: Config): Promise<void>;
//# sourceMappingURL=index.d.ts.map