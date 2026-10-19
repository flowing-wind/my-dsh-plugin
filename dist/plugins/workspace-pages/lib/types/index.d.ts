/** Authenticated static-page bundles and inline document delivery. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
/** Bounds for browser-packaged static documents. */
export interface Config {
    /** Maximum size of one preview asset in bytes. */
    maxAssetBytes: number;
    /** Maximum combined size of preview assets in bytes. */
    maxTotalBytes: number;
    /** Maximum number of assets included in one preview. */
    maxAssets: number;
}
/** Static-page resource limits. */
export declare const Config: schema<Config>;
/** Existing authenticated transport and conversation ownership. */
export declare const inject: string[];
/** @param ctx - Host services. @param config - Resource limits exposed to the trusted preview shell. */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map