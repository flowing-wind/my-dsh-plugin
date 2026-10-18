---
description: "Open PDFs, images, text, and static HTML explanations in a new browser tab through the authenticated Harness domain."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-pages

English | [中文](README.zh.md)

## Summary

Open PDFs, images, text, and static HTML explanations in a new browser tab through the authenticated Harness domain.

## Table of Contents

- [Use this package](#use-this-package)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

Install the bundled cordis.patch.yml layer and switch the feature independently in the Plugins list. Migration carries the package and configuration; the target Harness must expose the official APIs and UI extension slots used here.

maxAssetBytes, maxTotalBytes, and maxAssets bound local resources. HTML dependencies are packed into data URLs and executed in an opaque sandbox. Local classic scripts, CSS, images, and CSS url references are supported.

<a id="implementation"></a>
## Implementation

The Host entry owns authenticated endpoints; the browser entry registers lifecycle-owned UI. Unloading releases registrations without deleting workspace data.

There is no separate ./invariant entry: the plugin projects owned services and files without maintaining independently observed replicas.

<a id="model-experience"></a>
## Model Experience

### Static deliveries

#### What the model sees

The `workspace-pages` system section describes self-contained HTML deliveries through `present`. Browser preview interaction itself sends no message.

#### Token effect

The fixed guidance adds a stable system-prompt section.

#### KV Cache effect

The guidance is stable between requests; adding or removing it changes the request prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- No Python/Node server, remote requests, ES modules, CSS @import, form navigation, or Harness API access. Direct PDFs obey the asset-size limit.

### Dev Note

None.

Delivery actions register in the shared file card through deliverables.file.action; unloading removes the contributed action.
