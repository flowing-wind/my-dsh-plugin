---
description: "Display DeepSeek balance, per-conversation token estimates, and retained historical costs."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-usage-billing

English | [中文](README.zh.md)

## Summary

View today's tokens and estimated cost, the account's CNY balance, and lifetime usage with cache hit rates. Dated price generations classify requests by their start time. Details include existing and archived conversations; deleted details are folded into anonymous aggregate counters. Beijing calendar-day buckets use request start dates. Estimates use provider-reported tokens; the provider's actual deduction remains authoritative. Details group workspace subtotals with their conversations and mark archived rows; workspace subtotals are not added again to lifetime totals. Unnamed, unarchived blank placeholder conversations with zero usage are omitted from details.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

The package includes a `dsh.bundle` patch for installation in a profile and switching from the Plugins page. Portability requires a Harness build with the extension slots and Host APIs used below; a tarball does not patch an older Harness automatically.

Switch this package in the Plugins page’s Installed group. Disabling unloads its profile layer; enabling restores it. Migrate its packaged `cordis.patch.yml` together with the code and update deployment configuration.

Mount `@deepseek-ai/dsh-experimental-usage-billing` in a Web profile with Session persistence, storage domains, credentials, and the [shared usage dashboard](../usage-dashboard/README.md). Configure the following required fields; removing the row removes its dashboard section and conversation badge while retaining its stored ledger and other plugins' sections.

| Field | Meaning |
|---|---|
| `apiKeyEnv` | Credential reference, for example `DEEPSEEK_API_KEY` |
| `balanceUrl` | HTTPS balance endpoint, for example `https://api.deepseek.com/user/balance` |
| `balanceCacheMs` | Minimum interval between fresh balance requests |
| `requestTimeoutMs` | Balance request timeout |
| `refreshMs` | Browser refresh interval |
| `generations` | Nonempty list ordered by increasing `effectiveAt` timestamp |

Each generation specifies `provider`, `effectiveAt` in Unix milliseconds, Beijing `holidays` as `YYYY-MM-DD`, and a `models` dictionary. Each model has `peak` and `offPeak` prices with `input`, `cacheRead`, and `output` in CNY per million tokens. Provider names match the configured adapter; the shipped official adapter uses `deepseek-official`. Peak time is 09:00–12:00 and 14:00–18:00 on Beijing weekdays excluding configured holidays. Prices and the holiday calendar are deployment data and must be maintained explicitly.

Daily amounts can be reconstructed from retained conversation logs. For logs deleted before daily accounting was introduced, only their previously saved lifetime totals remain; their daily breakdown cannot be recovered.

The section heading has no subtitle. The middle card highlights the account balance or remaining daily confirmation budget.

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The [estimator](src/estimate.ts) folds durable request and assistant usage events, excludes inherited fork history, and applies replacement usage within each attempt. The [service](src/index.ts) refreshes its independent ledger after Session flush and before log deletion. Balance requests resolve the server credential and coalesce concurrent refreshes. No runtime invariant companion is published because estimates are derived from the Session log and the package has no independent token counter.

</details>

<a id="further-exploration"></a>
## Further Exploration

- [Session controller](../../api/session-controller/README.md)
- [Storage domains](../../storage/storage-domain/README.md)
- [Credentials](../../credentials/credentials/README.md)

<a id="model-experience"></a>
## Model Experience

None, as the ledger reads reported usage and balance queries do not invoke a model.

#### KV Cache effect

Accounting does not change model requests or invalidate an already-reusable prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Unknown provider/model prices are reported as unpriced requests and excluded from estimated cost.
- Child Sessions have separate rows; their usage is not merged into the parent's row.
- The balance may include account activity outside this Harness installation.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

Click a shaded workspace subtotal row to collapse or expand its conversation details; the subtotal remains visible.
