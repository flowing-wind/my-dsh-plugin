---
description: "On-demand API Key balance and official billing links for cloud Web deployments."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-account-balance

English | [中文](README.zh.md)

## Summary

Settings → API balance reads the balance behind the current DeepSeek API Key and links to official usage and top-up pages.

## Table of Contents

- [Use](#use)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use"></a>
## Use

Load the packaged `cordis.patch.yml` in the Web profile. Required configuration names the credential reference `apiKeyEnv`, HTTPS `balanceUrl`, and `requestTimeoutMs`. The bundle uses `DEEPSEEK_API_KEY`, `https://api.deepseek.com/user/balance`, and 15000 milliseconds. Add the API Key through Harness model settings, then open the balance section or select Refresh.

<a id="implementation"></a>
## Implementation

The authenticated Host route `/api/account-balance` resolves credentials for each request and sends the Bearer key to the configured HTTPS endpoint. It validates balance fields and omits upstream error bodies. Responses use `cache-control: no-store`. No ledger or polling is maintained, so there is no independent runtime invariant companion.

<a id="model-experience"></a>
## Model Experience

### Account settings

#### What the model sees

None. `account-balance` exposes browser settings and contributes no tools, prompts, or Session events.

#### Token effect

No model input is added.

#### KV Cache effect

Balance queries do not alter request content or reusable prefixes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The provider's balance is authoritative. Usage and top-up links open the official platform, where login may be required. This section keeps the native Harness account login flow. Cloud HTTPS deployments use API Key credentials because official account OAuth requires an HTTP loopback origin.

### Dev Note

None.
