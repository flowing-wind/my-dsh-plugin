---
description: "Set a compact draggable right panel and render official sidebar artwork."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-compact-layout

English | [中文](README.zh.md)

## Summary

Set the initial right-panel width to 300px and use the official DeepSeek Harness sidebar wordmark. Supports the matching official Web and Desktop profiles.

## Table of Contents

- [Use this package](#use-this-package)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

Install the bundled cordis.patch.yml layer. The initialWidth live configuration accepts 300–2000 pixels and defaults to 300. Native dragging changes the current window's preference; closing and reopening the panel preserves it. A new window uses initialWidth. The official responsive solver still decides whether the panel can fit.

<a id="implementation"></a>
## Implementation

The client shares ui-layout's root store through an additive shell.overlay registration, so the official renderer supplies its actions. This adapter is pinned to Harness 0.2.1-rc.2, whose root registration shares one store instance. Upgrade the adapter when the official layout API changes. The sidebar.brand.name slot uses the official BrandWordmark primitive; an existing official occupant retains its place. Host configuration reaches clients through the official configuration-form projection.

There is no separate ./invariant entry: the plugin contributes presentation and does not maintain independent state replicas.

<a id="model-experience"></a>
## Model Experience

### Browser layout

#### What the model sees

`compact-layout` adds no model inputs or session events.

#### Token effect

No model input is added.

#### KV Cache effect

Width preferences do not change model request content.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Width preferences belong to each open client window. Other Harness versions require compatibility validation.

### Dev Note

None.
