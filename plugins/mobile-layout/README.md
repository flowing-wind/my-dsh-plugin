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

No configuration. The browser plugin adds removable styles and a top-left sidebar toggle below 700px. Both sidebars fill the phone viewport and cover underlying text with opaque wallpaper surfaces. Their header buttons close them. The conversation title reserves space for the left toggle. The toggle paints its own opaque wallpaper layer over scrolling content.

<a id="implementation"></a>
## Implementation

The Host entry activates the browser package. The browser entry registers lifecycle-owned styles and navigation controls, removing them on unload.

There is no separate ./invariant entry: the plugin projects owned services and files without maintaining independently observed replicas.

<a id="model-experience"></a>
## Model Experience

No model tools or additional system sections; user actions call existing APIs.

<a id="known-limitations-and-deferred-work"></a>
## Known Limitations and Deferred Work

This is a browser layout, not an installed mobile app or push-notification service.

## Dev Note

None.
