/** Authenticated, streamed downloads using the existing workspace filesystem provider. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
import { type ArchiveConfig } from './archive-route.ts';
/** Folder ZIP storage and confirmation settings. */
export type Config = ArchiveConfig;
/** Explicit deployment archive settings. */
export declare const Config: schema<Config>;
/** Required authenticated carrier and existing file-read policy. */
export declare const inject: string[];
/**
 * Register a download route with bounded reads and cancellation.
 * @param ctx - Authenticated Web context and composed filesystem.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map