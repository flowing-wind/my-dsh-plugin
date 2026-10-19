/** Password verification and revocable page credentials for browser transports. */
import type { Context } from '@deepseek-ai/cordis';
import schema from '@deepseek-ai/schemastery';
/** Deployment password hash and login lifetime. */
export interface Config {
    /** Hex salt and 64-byte scrypt digest, separated by a colon. */
    passwordHash: string;
    /** Maximum lifetime without requests, in milliseconds. */
    idleMs: number;
    /** Password attempts allowed per address and minute. */
    attemptsPerMinute: number;
}
/** Required deployment credentials; plaintext passwords are never configured. */
export declare const Config: schema<Config>;
/** Browser transport and public login route owners. */
export declare const inject: string[];
/** @param ctx - HTTP transport and lifecycle. @param config - Salted password digest and expiry policy. */
export declare function apply(ctx: Context, config: Config): Promise<void>;
//# sourceMappingURL=index.d.ts.map