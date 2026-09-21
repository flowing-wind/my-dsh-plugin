# 网络用量

[English](network-usage.md) | 中文

可选的[网络用量包](../../packages/experimental/network-usage/README.zh.md)负责按对话计量传输、费用确认和计量代理访问。本参考列出其 Host 服务。`TrafficOwner` 标识一个对话；没有 Agent 发起者的请求使用字面量 `host`。

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxnetworkproxy--networkproxy"></a>

### `ctx.networkProxy` — `NetworkProxy`

Authenticated Host proxy and fixed-identity shell endpoints.

```ts cordis-catalog
/**
 * Obtain a Session-owned Unix proxy socket for a network-isolated shell.
 * @param sessionId - Session whose traffic this socket records.
 * @returns Absolute Unix socket path, inaccessible to other Sessions' sandbox mounts.
 */
socketFor(sessionId: SessionId): Promise<string>
```

Types: [SessionId](core.zh.md)

Source: [`packages/experimental/network-usage/src/proxy-plugin.ts`](../../packages/experimental/network-usage/src/proxy-plugin.ts)

<a id="ctxnetworkusage--networkusage"></a>

### `ctx.networkUsage` — `NetworkUsage`

Shared meter for proxy and browser transfers; confirmations never consume a model turn.

```ts cordis-catalog
/**
 * Wait for the current spending warning to be acknowledged, or for midnight reset.
 * @param signal - Owning transfer or Agent cancellation.
 */
async allow(signal: AbortSignal): Promise<void>

/**
 * Apply spending consent and one shared throttle across outgoing streams.
 * @param bytes - Next bounded chunk length.
 * @param signal - Transfer cancellation.
 */
async pace(bytes: number, signal: AbortSignal): Promise<void>

/**
 * Account bytes transferred at a proxy or browser carrier.
 * @param owner - Session identity or agentless Host traffic.
 * @param direction - Direction relative to the server.
 * @param bytes - Transferred payload bytes, excluding IP/TCP retransmission overhead.
 */
record(owner: TrafficOwner, direction: 'incoming' | 'outgoing', bytes: number): void

/**
 * Read dashboard counters and policy decisions.
 * @returns Detached lifetime totals and current enforcement state.
 */
snapshot(): object
```

Source: [`packages/experimental/network-usage/src/index.ts`](../../packages/experimental/network-usage/src/index.ts)
<!-- END GENERATED cordis-surface -->
