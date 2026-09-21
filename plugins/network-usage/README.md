---
description: "Track conversation traffic and require confirmation at configured daily spending thresholds."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-network-usage

English | [中文](README.zh.md)

## Summary

View incoming and outgoing traffic by conversation and across retained history. Configure rolling-window throttling and Beijing calendar-day spending confirmations. Linux shell commands can use a metered proxy inside a private network namespace. Charges estimate decimal-GB egress and do not reproduce a cloud provider's complete bill. Details group workspace subtotals with their conversations and mark archived rows; workspace subtotals are not added again to lifetime totals. Unnamed, unarchived blank placeholder conversations with zero usage are omitted from details.

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

Mount the package in a Web profile with storage and Agent services. Remove its profile rows to remove its UI and enforcement; stored totals remain available when remounted.

The network section appears in the [shared usage dashboard](../usage-dashboard/README.md). Its **Disable this throttle** action releases queued pacing for the current excess only. Automatic monitoring resumes once the rolling cost is at or below the threshold; a later excess throttles again. Daily spending confirmations remain required. The override is process-local and clears on service restart.

```yaml
- name: '@deepseek-ai/dsh-experimental-network-usage'
  config:
    cnyPerGB: 0.8
    windowMs: 600000
    windowCny: 0.5
    throttledMbps: 2
    dailyStepCny: 10
    checkpointMs: 1000
    refreshMs: 3000
```

Every field is required. Money is CNY, bandwidth is decimal Mbps, and durations are milliseconds. Egress strictly above `windowCny` activates shared pacing. Each reached `dailyStepCny` tier blocks metered transfers and Agent steps until the browser confirms that day's current tier. The day resets at Beijing midnight. There is no lifetime, conversation, or file-size cap.

For shell enforcement, also mount `/proxy` with an absolute private `socketDirectory`, `allowPrivateAddresses: false`, and `connectTimeoutMs: 15000`. Replace the existing local sandbox provider with `/sandbox`, configured with `runnerCommand: [/usr/bin/bwrap]` and `runnerFailureSignatures: ['bwrap:']`. Only confined permission presets enforce this networking policy. The socket directory must support Unix sockets.

Set `DSH_NETWORK_SOCKET_DIRECTORY` to an absolute private directory supporting Unix sockets before launching the packaged layer. The dashboard orders today’s egress and cost, remaining money before the next daily confirmation, then lifetime egress and cost. Details contain existing and archived conversations only; background transfers and deleted conversations remain in aggregate totals.

The section heading has no subtitle. The middle card highlights the account balance or remaining daily confirmation budget.

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The [budget](src/budget.ts) owns rolling observations and daily confirmations. The [service](src/index.ts) persists totals independently of conversation logs. The [proxy](src/proxy.ts) meters HTTP bodies and CONNECT tunnel bytes; the [sandbox provider](src/sandbox-plugin.ts) exposes a Session-owned Unix socket through an in-namespace bridge. The browser middleware meters authenticated file transfers. Requests without a Session owner contribute to aggregate totals only. No runtime invariant companion is published because counters and enforcement decisions share one owned ledger rather than independent observations.

</details>

<a id="further-exploration"></a>
## Further Exploration

- [Local sandbox](../../sandbox/sandbox-local/README.md)
- [Storage domains](../../storage/storage-domain/README.md)
- [Client connection](../../client/connection/README.md)

<a id="model-experience"></a>
## Model Experience

None, as traffic accounting and transport admission add no model-facing input.

#### KV Cache effect

Transport pauses do not change request tokens or invalidate an already-reusable prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Counts exclude IP/TCP overhead and retransmissions. Browser payload accounting can differ from compressed wire sizes.
- Shell enforcement requires Linux bubblewrap and excludes unconfined permission modes. The `/bash` executor preserves approval decisions and supplies Session-authenticated proxy variables to approved full-access commands; clients honoring these variables remain metered. Host programs that bypass the installed HTTP dispatcher are outside proxy accounting.
- Checkpoint intervals bound durability; an abrupt process loss can discard the latest uncheckpointed traffic.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

Click a shaded workspace subtotal row to collapse or expand its conversation details; the subtotal remains visible.
