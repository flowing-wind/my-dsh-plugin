/** Two-phase directory downloads with server-enforced size confirmation. */
import type { Context } from '@deepseek-ai/cordis';
/** Temporary archive retention and explicit browser confirmation policy. */
export interface ArchiveConfig {
    /** Absolute directory for temporary ZIP archives. */
    archiveDirectory: string;
    /** Archive size in bytes requiring explicit download confirmation. */
    confirmationBytes: number;
    /** Maximum retention of one prepared archive in milliseconds. */
    archiveLifetimeMs: number;
}
/**
 * Register two-phase archive preparation and download routes.
 * @param ctx - Authenticated connection and durable Sessions.
 * @param config - Archive storage and confirmation policy.
 */
export declare function registerArchives(ctx: Context, config: ArchiveConfig): void;
//# sourceMappingURL=archive-route.d.ts.map