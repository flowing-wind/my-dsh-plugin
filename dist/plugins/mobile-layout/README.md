---
description: "Provide full-width phone conversations, overlay workspace navigation, and large touch controls while retaining desktop layout."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-mobile-layout

English | [中文](README.zh.md)

## Summary

Provide full-width phone conversations, overlay workspace navigation, and large touch controls while retaining desktop layout.

## Table of Contents

- [Use this package](#use-this-package)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

Install the bundled cordis.patch.yml layer and switch the feature independently in the Plugins list. Migration carries the package and configuration; the target Harness must expose the official APIs and UI extension slots used here.

Below 700px, both sidebars fill the phone viewport and cover underlying text with the active theme background. Use the top-left sidebar button to open the navigation drawer and its header button to close it. Settings groups also use the full width. This package has no configuration.

<a id="implementation"></a>
## Implementation

The Host entry activates the browser package. The browser entry registers removable styles and uses the Harness navigation drawer on supported hosts.

There is no separate ./invariant entry: the plugin projects owned services and files without maintaining independently observed replicas.

<a id="model-experience"></a>
## Model Experience

### Browser layout

#### What the model sees

None. `mobile-layout` changes only browser layout and navigation.

#### Token effect

No model input is added.

#### KV Cache effect

Layout preferences do not change model request content.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- This is a browser layout, not an installed mobile app or push-notification service.

### Dev Note

None.
