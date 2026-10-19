/** API Key balance queries for remotely hosted browsers. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
/** Credential reference and provider request settings. */
export interface Config {
    /** Credential reference resolved for each provider request. */
    apiKeyEnv: string;
    /** HTTPS endpoint for the provider's balance API. */
    balanceUrl: string;
    /** Maximum duration of one balance request in milliseconds. */
    requestTimeoutMs: number;
}
/** Deployment-owned account endpoint and timeout. */
export declare const Config: schema<Config>;
/** Authenticated HTTP and private credential services. */
export declare const inject: string[];
/** @param ctx - Host credential and authenticated route owners. @param config - Balance request policy. */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map