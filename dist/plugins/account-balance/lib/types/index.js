import schema from '@deepseek-ai/schemastery';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { balanceSchema } from "./wire.js";
/** Deployment-owned account endpoint and timeout. */
export const Config = schema.object({
    apiKeyEnv: schema.string().required(), balanceUrl: schema.string().required(),
    requestTimeoutMs: schema.natural().min(1).required(),
});
/** Authenticated HTTP and private credential services. */
export const inject = ['connection', 'credentials'];
/** @param ctx - Host credential and authenticated route owners. @param config - Balance request policy. */
export function apply(ctx, config) {
    const reference = credentialRef(config.apiKeyEnv);
    const url = new URL(config.balanceUrl);
    if (url.protocol !== 'https:' || url.username || url.password)
        throw new Error('balanceUrl must be an HTTPS URL without user information');
    const lifetime = new AbortController();
    ctx.effect(() => () => { lifetime.abort(); });
    ctx.connection.fetch.register({
        path: '/api/account-balance', methods: ['GET'], requestBody: 'buffered',
        fetch: async (request) => {
            const key = await ctx.credentials.resolve(reference);
            if (key === undefined)
                return new Response('DeepSeek API Key is not configured', { status: 409 });
            try {
                const response = await fetch(url, {
                    headers: { authorization: `Bearer ${key.value}` }, redirect: 'error',
                    signal: AbortSignal.any([request.signal, lifetime.signal, AbortSignal.timeout(config.requestTimeoutMs)]),
                });
                if (!response.ok)
                    return new Response(`Balance request failed with HTTP ${response.status}`, { status: 502 });
                const value = balanceSchema.parse(await response.json());
                return Response.json(value, { headers: { 'cache-control': 'no-store' } });
            }
            catch (error) {
                if (request.signal.aborted || lifetime.signal.aborted)
                    throw error;
                return new Response('Balance request failed', { status: 502 });
            }
        },
    });
}
//# sourceMappingURL=index.js.map