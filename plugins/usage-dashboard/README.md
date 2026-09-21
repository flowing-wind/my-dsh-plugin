---
description: "Compose independent token and traffic statistics in one browser dashboard."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-usage-dashboard

English | [中文](README.zh.md)

## Summary

One Usage overview entry hosts independently removable accounting sections. This package owns navigation and layout, without collecting tokens, balances, or traffic.

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

Mount `@deepseek-ai/dsh-experimental-usage-dashboard` in a Web profile alongside either or both accounting plugins. No configuration is required. Removing an accounting plugin removes only its section; removing this dashboard hides its sections without stopping accounting or daily spending confirmations.

The page scrolls independently inside the main pane; expanding detail tables does not hide the navigation.

<a id="understand-the-implementation"></a>
## Understand the implementation

The browser entry declares the root-scoped list slot `usage-dashboard.section`. Each accounting plugin registers its own localized component and reads its own authenticated endpoint. No runtime invariant companion is published because the dashboard owns no independent data observations.

<a id="further-exploration"></a>
## Further Exploration

- [Token accounting](../usage-billing/README.md)
- [Network accounting](../network-usage/README.md)

<a id="model-experience"></a>
## Model Experience

None, as browser layout contributes no model-facing input.

#### KV Cache effect

Dashboard navigation does not change model requests or their reusable prefixes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

Sections refresh independently at their accounting plugin's configured interval; their observations are not an atomic combined snapshot.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
