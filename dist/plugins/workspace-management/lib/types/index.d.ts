/** Optional authenticated deletion of conversations and workspace registrations. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
/** Explicit root whose child workspace directories can be permanently removed. */
export interface Config {
    /** Existing absolute directory whose child workspaces may be deleted from disk. */
    managedWorkspaceRoot: string;
}
/** Directory deletion is restricted to children of this configured root. */
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